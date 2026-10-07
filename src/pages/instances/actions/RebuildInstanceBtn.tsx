import type { FC } from "react";
import { useState } from "react";
import {
  ActionButton,
  Button,
  ConfirmationModal,
  Form,
  Icon,
  Input,
  Modal,
  Notification,
  Select,
  usePortal,
  useToastNotification,
} from "@canonical/react-components";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { rebuildInstance, startInstance, stopInstance } from "api/instances";
import { useEventQueue } from "context/eventQueue";
import { useLocalImagesInProject } from "context/useImages";
import { useInstanceLoading } from "context/instanceLoading";
import { useImageRegistries } from "context/useImageRegistries";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import ImageSelector from "pages/images/ImageSelector";
import { InstanceRichChip } from "pages/instances/InstanceRichChip";
import { useNavigate } from "react-router-dom";
import type { RemoteImage } from "types/image";
import type { LxdInstance, LxdInstanceSource } from "types/instance";
import { useInstanceEntitlements } from "util/entitlements/instances";
import { remoteImageToInstanceSource } from "util/images";
import {
  defaultImageServers,
  getImageServerHost,
  IMAGE_SERVERS_KEY,
  inferOciImageReference,
  parseImageServers,
} from "util/imageServers";
import { queryKeys } from "util/queryKeys";
import { ROOT_PATH } from "util/rootPath";

interface Props {
  instance: LxdInstance;
  classname?: string;
  onClose?: () => void;
}

type RebuildStage = "stop" | "rebuild" | "restart";

interface SelectedSource {
  label: string;
  source: LxdInstanceSource;
}

interface ManualSource extends SelectedSource {
  matchProtocol?: string;
  matchServer?: string;
  value: string;
}

const RebuildInstanceBtn: FC<Props> = ({ instance, classname, onClose }) => {
  const eventQueue = useEventQueue();
  const navigate = useNavigate();
  const instanceLoading = useInstanceLoading();
  const queryClient = useQueryClient();
  const toastNotify = useToastNotification();
  const { canEditInstance, canUpdateInstanceState } = useInstanceEntitlements();
  const { hasImageRegistries, settings } = useSupportedFeatures();
  const { data: imageRegistries = [] } = useImageRegistries(hasImageRegistries);
  const { data: localImages = [] } = useLocalImagesInProject(instance.project);
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const [selectedSource, setSelectedSource] = useState<SelectedSource>();
  const [isUsingImageReference, setUsingImageReference] = useState(false);
  const [manualSourceName, setManualSourceName] = useState("");
  const [manualAlias, setManualAlias] = useState("");
  const [isLoading, setLoading] = useState(false);

  const legacyServers = parseImageServers(
    settings?.config?.[IMAGE_SERVERS_KEY],
  );
  const availableLegacyServers = [...legacyServers, ...defaultImageServers]
    .filter(
      (server, index, servers) =>
        index === servers.findIndex((item) => item.name === server.name),
    )
    .filter(
      (server) => instance.type === "container" || server.protocol !== "oci",
    );
  const registrySources: ManualSource[] = imageRegistries.map((registry) => ({
    label: registry.name,
    matchProtocol: registry.protocol,
    matchServer: registry.config?.url,
    value: registry.name,
    source: {
      type: "image" as const,
      mode: "pull" as const,
      image_registry: registry.name,
    },
  }));
  const customRemoteSources: ManualSource[] = legacyServers
    .filter(
      (server) => instance.type === "container" || server.protocol !== "oci",
    )
    .map((server) => ({
      label: server.name || server.url,
      matchProtocol: server.protocol,
      matchServer: server.url,
      value: server.url,
      source: {
        type: "image" as const,
        mode: "pull" as const,
        protocol: server.protocol,
        server: server.url,
      },
    }));
  const legacyRemoteSources: ManualSource[] = availableLegacyServers.map(
    (server) => ({
      label: server.name || server.url,
      matchProtocol: server.protocol,
      matchServer: server.url,
      value: server.url,
      source: {
        type: "image" as const,
        mode: "pull" as const,
        protocol: server.protocol,
        server: server.url,
      },
    }),
  );
  const manualSources: ManualSource[] = hasImageRegistries
    ? [...registrySources, ...customRemoteSources]
    : legacyRemoteSources;

  const selectedManualSource =
    manualSources.find((source) => source.value === manualSourceName) ??
    manualSources[0];

  const instanceLink = (
    <InstanceRichChip
      instanceName={instance.name}
      projectName={instance.project}
    />
  );

  const close = () => {
    closePortal();
    setSelectedSource(undefined);
    setUsingImageReference(false);
    setManualSourceName("");
    setManualAlias("");
    onClose?.();
  };

  const waitForOperation = async (
    operation: Awaited<ReturnType<typeof rebuildInstance>>,
  ) =>
    new Promise<void>((resolve, reject) => {
      eventQueue.set(
        operation.metadata.id,
        () => {
          resolve();
        },
        (message) => {
          reject(new Error(message));
        },
      );
    });

  const clearCache = () => {
    queryClient.invalidateQueries({
      queryKey: [queryKeys.instances],
    });
    queryClient.invalidateQueries({
      queryKey: [queryKeys.operations, instance.project],
    });
  };

  const handleRebuild = async () => {
    if (!selectedSource) {
      return;
    }

    const imageSource = selectedSource;
    const wasRunning = instance.status === "Running";
    let stage: RebuildStage = wasRunning ? "stop" : "rebuild";
    close();
    setLoading(true);

    try {
      if (wasRunning) {
        instanceLoading.setLoading(instance, "Stopping");
        const stopOperation = await stopInstance(instance, true);
        await waitForOperation(stopOperation);
      }

      stage = "rebuild";
      instanceLoading.setLoading(instance, "Rebuilding");
      const rebuildOperation = await rebuildInstance(
        instance,
        imageSource.source,
      );
      await waitForOperation(rebuildOperation);

      if (wasRunning) {
        stage = "restart";
        instanceLoading.setLoading(instance, "Starting");
        const startOperation = await startInstance(instance);
        await waitForOperation(startOperation);
      }

      toastNotify.success(
        <>
          Instance {instanceLink} rebuilt from{" "}
          <strong>{imageSource.label}</strong>
          {wasRunning ? " and restarted" : ""}.
        </>,
      );
    } catch (error) {
      const stageLabels: Record<RebuildStage, string> = {
        stop: "stop",
        rebuild: "rebuild",
        restart: "restart after rebuild",
      };
      toastNotify.failure(
        `Instance ${stageLabels[stage]} failed`,
        error,
        instanceLink,
      );
    } finally {
      instanceLoading.setFinish(instance);
      setLoading(false);
      clearCache();
    }
  };

  const getDisabledReason = () => {
    if (!canEditInstance(instance)) {
      return "You do not have permission to rebuild this instance";
    }

    if (instance.status === "Running" && !canUpdateInstanceState(instance)) {
      return "You do not have permission to stop and restart this instance";
    }

    if (instance.status === "Frozen") {
      return "Stop the frozen instance before rebuilding it";
    }

    if (!["Running", "Stopped"].includes(instance.status)) {
      return "The instance must be running or stopped to rebuild it";
    }

    if (instanceLoading.getType(instance)) {
      return "Wait for the current instance operation to finish";
    }

    return "";
  };

  const disabledReason = getDisabledReason();
  const wasRunning = instance.status === "Running";
  const normalizedManualAlias = manualAlias.trim();
  const baseImageFingerprint =
    instance.config["volatile.base_image"] ??
    instance.expanded_config["volatile.base_image"];
  const baseImage = localImages.find(
    (image) =>
      baseImageFingerprint &&
      (image.fingerprint === baseImageFingerprint ||
        image.fingerprint.startsWith(baseImageFingerprint)),
  );
  const normalizeServer = (server?: string) =>
    server?.replace(/\/+$/, "").toLowerCase();
  const updateSource = baseImage?.update_source;
  const ociImageReference = inferOciImageReference({
    ...instance.expanded_config,
    ...instance.config,
  });
  const updateSourceMatch = updateSource
    ? (manualSources.find(
        (source) =>
          source.matchProtocol === updateSource.protocol &&
          normalizeServer(source.matchServer) ===
            normalizeServer(updateSource.server),
      ) ??
      manualSources.find(
        (source) => source.matchProtocol === updateSource.protocol,
      ))
    : undefined;
  const ociMetadataMatch = ociImageReference
    ? manualSources.find(
        (source) =>
          source.matchProtocol === "oci" &&
          getImageServerHost(source.matchServer) === ociImageReference.server,
      )
    : undefined;
  const inferredManualSource = updateSourceMatch ?? ociMetadataMatch;
  const inferredAlias = updateSource?.alias ?? ociImageReference?.alias ?? "";

  const selectImage = (image: RemoteImage) => {
    setSelectedSource({
      label: image.aliases,
      source: remoteImageToInstanceSource(image, hasImageRegistries),
    });
  };

  const selectManualReference = () => {
    if (!selectedManualSource || !normalizedManualAlias) {
      return;
    }

    setSelectedSource({
      label: `${selectedManualSource.label}:${normalizedManualAlias}`,
      source: {
        ...selectedManualSource.source,
        alias: normalizedManualAlias,
      },
    });
  };

  const useImageReference = () => {
    setManualSourceName(
      inferredManualSource?.value ?? manualSources[0]?.value ?? "",
    );
    setManualAlias(inferredAlias);
    setUsingImageReference(true);
  };

  const manageRemotes = () => {
    close();
    const path = `${ROOT_PATH}/ui/settings?query=${encodeURIComponent(
      IMAGE_SERVERS_KEY,
    )}`;
    void navigate(path);
  };

  return (
    <>
      <ActionButton
        appearance="default"
        aria-label="Rebuild instance"
        className={classNames("u-no-margin--bottom has-icon", classname)}
        disabled={Boolean(disabledReason)}
        loading={isLoading}
        onClick={openPortal}
        title={disabledReason || "Rebuild instance"}
      >
        <Icon name="restart" />
        <span>Rebuild</span>
      </ActionButton>
      {isOpen && (
        <Portal>
          {selectedSource ? (
            <ConfirmationModal
              close={close}
              confirmButtonAppearance="negative"
              confirmButtonLabel="Rebuild"
              onConfirm={() => void handleRebuild()}
              title="Confirm rebuild"
            >
              <p>
                Rebuild instance <strong>{instance.name}</strong> from image{" "}
                <strong>{selectedSource.label}</strong>?
              </p>
              <Notification severity="negative" title="Data loss warning">
                Rebuilding replaces the instance root disk. All data on the root
                disk will be permanently lost.
              </Notification>
              {wasRunning && (
                <Notification severity="caution" title="Instance is running">
                  The instance will be force-stopped before rebuilding and
                  restarted after the rebuild succeeds.
                </Notification>
              )}
            </ConfirmationModal>
          ) : isUsingImageReference ? (
            <Modal
              buttonRow={
                <>
                  <Button
                    appearance="base"
                    className="u-no-margin--bottom"
                    onClick={() => {
                      setUsingImageReference(false);
                    }}
                    type="button"
                  >
                    Back
                  </Button>
                  <Button
                    appearance="positive"
                    className="u-no-margin--bottom"
                    disabled={!selectedManualSource || !normalizedManualAlias}
                    onClick={selectManualReference}
                    type="button"
                  >
                    Continue
                  </Button>
                </>
              }
              close={close}
              title="Use image reference"
            >
              <Form
                onSubmit={(event) => {
                  event.preventDefault();
                  selectManualReference();
                }}
              >
                <Select
                  id="rebuild-image-source"
                  help={
                    hasImageRegistries
                      ? "Select the configured image registry that contains the image."
                      : "Select a standard Incus image remote or a custom Web UI remote. OCI remotes are available for containers only. Remotes configured only in the local Incus CLI are not available to the browser."
                  }
                  label="Remote"
                  name="image-source"
                  onChange={(event) => {
                    setManualSourceName(event.target.value);
                  }}
                  options={manualSources.map(({ label, value }) => ({
                    label,
                    value,
                  }))}
                  required
                  value={manualSourceName || selectedManualSource?.value || ""}
                />
                <Button
                  appearance="base"
                  className="u-no-margin--top"
                  hasIcon
                  onClick={manageRemotes}
                  type="button"
                >
                  <Icon name="plus" />
                  <span>Configure Web UI remotes</span>
                </Button>
                <Input
                  autoFocus
                  help={
                    <>
                      Enter the image reference exactly as it appears on the
                      remote, using <code>organisation/repository:version</code>
                      .
                    </>
                  }
                  label="Image (organisation/repository:version)"
                  name="image-alias"
                  onChange={(event) => {
                    setManualAlias(event.target.value);
                  }}
                  placeholder="organisation/repository:version"
                  required
                  type="text"
                  value={manualAlias}
                />
                <Input type="submit" hidden value="Select image reference" />
              </Form>
            </Modal>
          ) : (
            <ImageSelector
              excludeLocalIso
              imageType={instance.type}
              onClose={close}
              onSelect={selectImage}
              onUseImageReference={
                manualSources.length ? useImageReference : undefined
              }
            />
          )}
        </Portal>
      )}
    </>
  );
};

export default RebuildInstanceBtn;

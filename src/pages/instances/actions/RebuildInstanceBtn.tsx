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
import { useInstanceLoading } from "context/instanceLoading";
import { useImageRegistries } from "context/useImageRegistries";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import ImageSelector from "pages/images/ImageSelector";
import { InstanceRichChip } from "pages/instances/InstanceRichChip";
import type { RemoteImage } from "types/image";
import type { LxdInstance, LxdInstanceSource } from "types/instance";
import { useInstanceEntitlements } from "util/entitlements/instances";
import { remoteImageToInstanceSource } from "util/images";
import { IMAGE_SERVERS_KEY, parseImageServers } from "util/imageServers";
import { linuxContainersServer } from "util/imageLegacy";
import { queryKeys } from "util/queryKeys";

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

const RebuildInstanceBtn: FC<Props> = ({ instance, classname, onClose }) => {
  const eventQueue = useEventQueue();
  const instanceLoading = useInstanceLoading();
  const queryClient = useQueryClient();
  const toastNotify = useToastNotification();
  const { canEditInstance, canUpdateInstanceState } = useInstanceEntitlements();
  const { hasImageRegistries, settings } = useSupportedFeatures();
  const { data: imageRegistries = [] } = useImageRegistries(hasImageRegistries);
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const [selectedSource, setSelectedSource] = useState<SelectedSource>();
  const [isUsingImageReference, setUsingImageReference] = useState(false);
  const [manualSourceName, setManualSourceName] = useState("");
  const [manualAlias, setManualAlias] = useState("");
  const [isLoading, setLoading] = useState(false);

  const legacyServers = parseImageServers(
    settings?.config?.[IMAGE_SERVERS_KEY],
  );
  const manualSources = hasImageRegistries
    ? imageRegistries.map((registry) => ({
        label: registry.name,
        value: registry.name,
        source: {
          type: "image" as const,
          mode: "pull" as const,
          image_registry: registry.name,
        },
      }))
    : (legacyServers.length
        ? legacyServers
        : [
            {
              name: "Linux Containers",
              url: linuxContainersServer,
              protocol: "simplestreams" as const,
            },
          ]
      ).map((server) => ({
        label: server.name || server.url,
        value: server.url,
        source: {
          type: "image" as const,
          mode: "pull" as const,
          protocol: server.protocol,
          server: server.url,
        },
      }));

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

  const waitForOperation = (
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
                  label={hasImageRegistries ? "Image registry" : "Image server"}
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
                <Input
                  autoFocus
                  help="Enter the image alias exactly as it appears in the source, for example repo/imagename:imageversion."
                  label="Image alias"
                  name="image-alias"
                  onChange={(event) => {
                    setManualAlias(event.target.value);
                  }}
                  placeholder="repo/imagename:imageversion"
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
                manualSources.length
                  ? () => {
                      setUsingImageReference(true);
                    }
                  : undefined
              }
            />
          )}
        </Portal>
      )}
    </>
  );
};

export default RebuildInstanceBtn;

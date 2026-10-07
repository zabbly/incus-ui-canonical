import type { FC } from "react";
import { useState } from "react";
import {
  ActionButton,
  ConfirmationModal,
  Icon,
  Notification,
  usePortal,
  useToastNotification,
} from "@canonical/react-components";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { rebuildInstance, startInstance, stopInstance } from "api/instances";
import { useEventQueue } from "context/eventQueue";
import { useLocalImagesInProject } from "context/useImages";
import { useInstanceLoading } from "context/instanceLoading";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import ImageReferenceSelector from "pages/images/ImageReferenceSelector";
import ImageSelector from "pages/images/ImageSelector";
import { InstanceRichChip } from "pages/instances/InstanceRichChip";
import type { RemoteImage } from "types/image";
import type { LxdInstance, LxdInstanceSource } from "types/instance";
import { useInstanceEntitlements } from "util/entitlements/instances";
import { remoteImageToInstanceSource } from "util/images";
import { inferOciImageReference } from "util/imageServers";
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
  const { data: localImages = [] } = useLocalImagesInProject(instance.project);
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const [selectedSource, setSelectedSource] = useState<SelectedSource>();
  const [isUsingImageReference, setUsingImageReference] = useState(false);
  const [isLoading, setLoading] = useState(false);

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
  const baseImageFingerprint =
    instance.config["volatile.base_image"] ??
    instance.expanded_config["volatile.base_image"];
  const baseImage = localImages.find(
    (image) =>
      baseImageFingerprint &&
      (image.fingerprint === baseImageFingerprint ||
        image.fingerprint.startsWith(baseImageFingerprint)),
  );
  const updateSource = baseImage?.update_source;
  const ociImageReference = inferOciImageReference({
    ...instance.expanded_config,
    ...instance.config,
  });
  const inferredProtocol = updateSource?.protocol
    ? updateSource.protocol
    : ociImageReference
      ? "oci"
      : undefined;
  const inferredServer = updateSource?.server ?? ociImageReference?.server;
  const inferredAlias = updateSource?.alias ?? ociImageReference?.alias ?? "";

  const selectImage = (image: RemoteImage) => {
    setSelectedSource({
      label: image.aliases,
      source: remoteImageToInstanceSource(image),
    });
  };

  const useImageReference = () => {
    setUsingImageReference(true);
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
            <ImageReferenceSelector
              imageType={instance.type}
              initialAlias={inferredAlias}
              initialProtocol={inferredProtocol}
              initialServer={inferredServer}
              onBack={() => {
                setUsingImageReference(false);
              }}
              onClose={close}
              onSelect={selectImage}
            />
          ) : (
            <ImageSelector
              excludeLocalIso
              imageType={instance.type}
              onClose={close}
              onSelect={selectImage}
              onUseImageReference={useImageReference}
            />
          )}
        </Portal>
      )}
    </>
  );
};

export default RebuildInstanceBtn;

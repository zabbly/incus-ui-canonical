import type { FC } from "react";
import { useState } from "react";
import { updateInstance } from "api/instances";
import type { LxdInstance } from "types/instance";
import { useParams } from "react-router-dom";
import {
  ActionButton,
  ContextualMenu,
  useToastNotification,
  usePortal,
  Icon,
} from "@canonical/react-components";
import {
  getInstanceEditValues,
  getInstancePayload,
} from "util/instanceAndProfilePayloads";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import type { RemoteImage } from "types/image";
import CustomIsoModal from "pages/images/CustomIsoModal";
import type { IsoVolumeDevice } from "types/formDevice";
import { deduplicateName, remoteImageToIsoDevice } from "util/formDevices";
import { useEventQueue } from "context/eventQueue";
import { instanceLinkFromOperation } from "util/operations";
import ResourceLink from "components/ResourceLink";
import { useInstanceEntitlements } from "util/entitlements/instances";
import { InstanceRichChip } from "../InstanceRichChip";
import { ROOT_PATH } from "util/rootPath";
import {
  getExistingDeviceNames,
  isIsoDiskDevice,
  ISO_VOLUME_NAME,
} from "util/devices";
import { useProfiles } from "context/useProfiles";

interface Props {
  instance: LxdInstance;
}

const AttachIsoBtn: FC<Props> = ({ instance }) => {
  const eventQueue = useEventQueue();
  const { project } = useParams<{ project: string }>();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const [isLoading, setLoading] = useState(false);
  const { canEditInstance } = useInstanceEntitlements();

  const { data: profiles = [] } = useProfiles(instance.project);

  const attachedIsos = getInstanceEditValues(instance).devices.filter(
    isIsoDiskDevice,
  ) as IsoVolumeDevice[];

  const detachIso = (isoDevice: IsoVolumeDevice) => {
    setLoading(true);
    const values = getInstanceEditValues(instance);
    values.devices = values.devices.filter((device) => {
      return device.name !== isoDevice.name;
    });
    const instanceMinusIso = getInstancePayload(
      instance,
      values,
    ) as LxdInstance;
    const instanceLink = (
      <InstanceRichChip
        instanceName={instance.name}
        projectName={instance.project}
      />
    );
    updateInstance(instanceMinusIso, project ?? "")
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () =>
            toastNotify.success(
              <>
                ISO{" "}
                <ResourceLink
                  to={`${ROOT_PATH}/ui/project/${encodeURIComponent(project ?? "")}/storage/custom-isos`}
                  type="iso-volume"
                  value={isoDevice.source}
                />{" "}
                detached from {instanceLink}
              </>,
            ),
          (msg) =>
            toastNotify.failure(
              "Detaching ISO failed.",
              new Error(msg),
              instanceLink,
            ),
          () => {
            queryClient.invalidateQueries({
              queryKey: [queryKeys.instances, instance.name, project],
            });
            setLoading(false);
          },
        );
      })
      .catch((e) => {
        setLoading(false);
        toastNotify.failure("Detaching ISO failed.", e, instanceLink);
      });
  };

  const handleSelect = (image: RemoteImage) => {
    setLoading(true);
    closePortal();
    const values = getInstanceEditValues(instance);
    const deviceName = deduplicateName(
      ISO_VOLUME_NAME,
      1,
      getExistingDeviceNames(values, profiles),
    );
    const isoDevice = remoteImageToIsoDevice(image, deviceName);
    values.devices.push(isoDevice);
    const instancePlusIso = getInstancePayload(instance, values) as LxdInstance;
    updateInstance(instancePlusIso, project ?? "")
      .then((operation) => {
        const instanceLink = instanceLinkFromOperation({
          operation,
          project,
        });
        eventQueue.set(
          operation.metadata.id,
          () =>
            toastNotify.success(
              <>
                ISO{" "}
                <ResourceLink
                  to={`${ROOT_PATH}/ui/project/${encodeURIComponent(project ?? "")}/storage/custom-isos`}
                  type="iso-volume"
                  value={image.aliases}
                />{" "}
                attached to {instanceLink}
              </>,
            ),
          (msg) =>
            toastNotify.failure(
              "Attaching ISO failed.",
              new Error(msg),
              instanceLink,
            ),
          () => {
            queryClient.invalidateQueries({
              queryKey: [queryKeys.instances, instance.name, project],
            });
            setLoading(false);
          },
        );
      })
      .catch((e) => {
        setLoading(false);
        toastNotify.failure("Attaching ISO failed.", e);
      });
  };

  const disabledReason = canEditInstance(instance)
    ? undefined
    : "You do not have permission to edit this instance.";

  return (
    <>
      <ActionButton
        loading={isLoading}
        onClick={openPortal}
        className="u-no-margin--bottom has-icon"
        disabled={!!disabledReason || isLoading}
        title={disabledReason}
      >
        <Icon name="iso" />
        <span>Attach ISO</span>
      </ActionButton>
      {attachedIsos.length > 0 && (
        <ContextualMenu
          hasToggleIcon
          toggleLabel={`${attachedIsos.length} ISO${attachedIsos.length > 1 ? "s" : ""} attached`}
          toggleClassName="u-no-margin--bottom"
          toggleDisabled={!!disabledReason || isLoading}
          toggleProps={{ title: disabledReason }}
          links={attachedIsos.map((isoDevice) => ({
            children: `Detach ${isoDevice.source}`,
            onClick: () => {
              detachIso(isoDevice);
            },
          }))}
        />
      )}
      {isOpen && (
        <Portal>
          <CustomIsoModal onClose={closePortal} onSelect={handleSelect} />
        </Portal>
      )}
    </>
  );
};

export default AttachIsoBtn;

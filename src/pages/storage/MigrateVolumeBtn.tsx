import type { FC } from "react";
import { useState } from "react";
import {
  ActionButton,
  Icon,
  usePortal,
  useToastNotification,
} from "@canonical/react-components";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { useEventQueue } from "context/eventQueue";
import type { LxdStorageVolume } from "types/storage";
import MigrateVolumeModal from "./MigrateVolumeModal";
import {
  copyCustomVolumeToTarget,
  deleteStorageVolume,
  migrateStorageVolume,
} from "api/storage-volumes";
import { useNavigate } from "react-router-dom";
import ResourceLabel from "components/ResourceLabel";
import ResourceLink from "components/ResourceLink";
import { migrateStorageVolume } from "api/storage-volumes";
import { useStorageVolumeEntitlements } from "util/entitlements/storage-volumes";
import { hasLocation } from "util/storageVolume";
import VolumeLinkChip from "pages/storage/VolumeLinkChip";
import classNames from "classnames";

interface Props {
  volume: LxdStorageVolume;
  project: string;
  classname?: string;
  onClose?: () => void;
}

const MigrateVolumeBtn: FC<Props> = ({
  volume,
  project,
  classname,
  onClose,
}) => {
  const eventQueue = useEventQueue();
  const toastNotify = useToastNotification();
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isVolumeLoading, setVolumeLoading] = useState(false);
  const { canEditVolume } = useStorageVolumeEntitlements();

  const handleStoragePoolMigrationSuccess = (
    newTarget: string,
    storageVolume: LxdStorageVolume,
  ) => {
    const memberPath = hasLocation(volume)
      ? `/member/${encodeURIComponent(volume.location)}`
      : "";
    const oldVolumeUrl = `/ui/project/${encodeURIComponent(storageVolume.project)}/storage/pool/${encodeURIComponent(storageVolume.pool)}${memberPath}/volumes/${encodeURIComponent(storageVolume.type)}/${encodeURIComponent(storageVolume.name)}`;
    const newVolumeUrl = `/ui/project/${encodeURIComponent(storageVolume.project)}/storage/pool/${encodeURIComponent(newTarget)}${memberPath}/volumes/${encodeURIComponent(storageVolume.type)}/${encodeURIComponent(storageVolume.name)}`;

    const volumeLink = (
      <ResourceLink
        type="volume"
        value={storageVolume.name}
        to={newVolumeUrl}
      />
    );
    const poolLink = (
      <ResourceLink
        type="pool"
        value={newTarget}
        to={`/ui/project/${encodeURIComponent(storageVolume.project)}/storage/pool/${encodeURIComponent(newTarget)}`}
      />
    );
    toastNotify.success(
      <>
        Volume {volumeLink} successfully migrated to pool {poolLink}
      </>,
    );

    if (window.location.pathname.startsWith(oldVolumeUrl)) {
      navigate(newVolumeUrl);
    }
  };

  const handleClusterMemberMigrationSuccess = (
    volume: LxdStorageVolume,
    newTarget: string,
  ) => {
    const volumeUrl = `/ui/project/${volume.project}/storage/pool/${volume.pool}/volumes/${volume.type}/${volume.name}`;

    const volumeLink = (
      <ResourceLink type="volume" value={volume.name} to={volumeUrl} />
    );
    toastNotify.success(
      <>
        Volume {volumeLink} successfully migrated to {newTarget}
      </>,
    );
  };

  const notifyFailure = (
    e: unknown,
    volumeName: string,
    failureMsg: string,
  ) => {
    setVolumeLoading(false);
    toastNotify.failure(
      failureMsg,
      e,
      <VolumeLinkChip volume={volume} />,
    );
  };

  const handleFailure = (
    msg: string,
    volume: string,
    failureMsg: string,
  ) => {
    notifyFailure(new Error(msg), volume, failureMsg);
  };

  const handleFinish = () => {
    queryClient.invalidateQueries({
      queryKey: [queryKeys.storage, volume.name],
    });
    setVolumeLoading(false);
  };

  const handleMigrate = (
    targetPool: string | undefined,
    targetMember: string | undefined,
  ) => {
    if (targetPool) {
      handleStoragePoolMigration(targetPool);
    } else if (targetMember) {
      handleClusterMemberMigration(targetMember);
    }
  };

  const handleStoragePoolMigration = (targetPool: string) => {
    setVolumeLoading(true);
    migrateStorageVolume(volume, targetPool, volume.project, volume.location)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => {
            handleStoragePoolMigrationSuccess(targetPool, volume);
          },
          (err) => {
            handleFailure(err, volume.name, failureMsg);
          },
          handleFinish,
        );
        const volumeLabel = (
          <ResourceLabel bold type="volume" value={volume.name} />
        );
        const poolLink = (
          <ResourceLink
            type="pool"
            value={targetPool}
            to={`/ui/project/${encodeURIComponent(volume.project)}/storage/pool/${encodeURIComponent(targetPool)}`}
          />
        );
        toastNotify.info(
          <>
            Migration started for volume {volumeLabel} to pool {poolLink}
          </>,
        );
        queryClient.invalidateQueries({
          queryKey: [queryKeys.storage, volume.name, project],
        });
      })
      .catch((e) => {
        notifyFailure(e, volume.name, failureMsg);
      })
      .finally(() => {
        handleClose();
      });
  };

  const handleOldVolumeDeletion = (
    oldVolume: LxdStorageVolume,
    newTarget: string,
  ) => {
    deleteStorageVolume(
      oldVolume.name,
      oldVolume.pool,
      oldVolume.project,
      oldVolume.location,
    )
      .then(() => {
        handleClusterMemberMigrationSuccess(oldVolume, newTarget);
      })
      .catch((e) => {
        notifyFailure(
          e,
          volume.name,
          `Migration failed for volume ${oldVolume.name} to target ${newTarget}`,
        );
      });
  };

  const handleClusterMemberMigration = (targetMember: string) => {
    setVolumeLoading(true);
    const failureMsg = `Migration failed for volume ${volume.name} to target ${targetMember}`;
    copyCustomVolumeToTarget(volume.project, volume, targetMember)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => handleOldVolumeDeletion(volume, targetMember),
          (err) => handleFailure(err, volume.name, failureMsg),
          handleFinish,
        );
        const volumeLink = (
          <ResourceLabel bold type="volume" value={volume.name} />
        );
        toastNotify.info(
          <>
            Migration started for volume {volumeLink} to {targetMember}
          </>,
        );
        void queryClient.invalidateQueries({
          queryKey: [queryKeys.storage, volume.name, project],
        });
        handleClose();
      })
      .catch((e) => {
        notifyFailure(e, volume.name, failureMsg);
      });
  };

  const handleClose = () => {
    closePortal();
    onClose?.();
  };

  return (
    <>
      {isOpen && (
        <Portal>
          <MigrateVolumeModal
            close={handleClose}
            migrate={handleMigrate}
            storageVolume={volume}
          />
        </Portal>
      )}
      <ActionButton
        onClick={openPortal}
        type="button"
        className={classNames("u-no-margin--bottom has-icon", classname)}
        loading={isVolumeLoading}
        disabled={!canEditVolume(volume) || isVolumeLoading}
        title={
          canEditVolume(volume)
            ? "Migrate volume"
            : "You do not have permission to migrate this volume"
        }
      >
        <Icon name="machines" />
        <span>Migrate</span>
      </ActionButton>
    </>
  );
};

export default MigrateVolumeBtn;

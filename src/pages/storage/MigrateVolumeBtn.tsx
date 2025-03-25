import { FC, useState } from "react";
import { ActionButton, Icon } from "@canonical/react-components";
import usePortal from "react-useportal";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { useEventQueue } from "context/eventQueue";
import { useToastNotification } from "context/toastNotificationProvider";
import { LxdStorageVolume } from "types/storage";
import MigrateVolumeModal from "./MigrateVolumeModal";
import {
  copyCustomVolumeToTarget,
  deleteStorageVolume,
  migrateStorageVolume,
} from "api/storage-pools";
import { useNavigate } from "react-router-dom";
import ResourceLabel from "components/ResourceLabel";
import ResourceLink from "components/ResourceLink";

interface Props {
  storageVolume: LxdStorageVolume;
  project: string;
  classname?: string;
  onClose?: () => void;
}

const MigrateVolumeBtn: FC<Props> = ({
  storageVolume,
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

  const handleStoragePoolMigrationSuccess = (
    newTarget: string,
    storageVolume: LxdStorageVolume,
  ) => {
    const oldVolumeUrl = `/ui/project/${storageVolume.project}/storage/pool/${storageVolume.pool}/volumes/${storageVolume.type}/${storageVolume.name}`;
    const newVolumeUrl = `/ui/project/${storageVolume.project}/storage/pool/${newTarget}/volumes/${storageVolume.type}/${storageVolume.name}`;

    const volume = (
      <ResourceLink
        type="volume"
        value={storageVolume.name}
        to={newVolumeUrl}
      />
    );
    const pool = (
      <ResourceLink
        type="pool"
        value={newTarget}
        to={`/ui/project/${storageVolume.project}/storage/pool/${newTarget}`}
      />
    );
    toastNotify.success(
      <>
        Volume {volume} successfully migrated to pool {pool}
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
      <ResourceLink
        type="volume"
        value={volumeName}
        to={`/ui/project/${project}/storage/pool/${storageVolume.pool}/volumes/${storageVolume.type}/${volumeName}`}
      />,
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
    void queryClient.invalidateQueries({
      queryKey: [queryKeys.storage, storageVolume.name],
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
    const failureMsg = `Migration failed for volume ${storageVolume.name} to pool ${targetPool}`;
    migrateStorageVolume(storageVolume, targetPool, storageVolume.project)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => handleStoragePoolMigrationSuccess(targetPool, storageVolume),
          (err) => handleFailure(err, storageVolume.name, failureMsg),
          handleFinish,
        );
        const volume = (
          <ResourceLabel bold type="volume" value={storageVolume.name} />
        );
        const pool = (
          <ResourceLink
            type="pool"
            value={targetPool}
            to={`/ui/project/${storageVolume.project}/storage/pool/${targetPool}`}
          />
        );
        toastNotify.info(
          <>
            Migration started for volume {volume} to pool {pool}
          </>,
        );
        void queryClient.invalidateQueries({
          queryKey: [queryKeys.storage, storageVolume.name, project],
        });
        handleClose();
      })
      .catch((e) => {
        notifyFailure(e, storageVolume.name, failureMsg);
      });
  };

  const handleOldVolumeDeletion = (
    volume: LxdStorageVolume,
    newTarget: string,
  ) => {
    deleteStorageVolume(
      volume.name,
      volume.pool,
      volume.project,
      volume.location,
    )
      .then(() => {
        handleClusterMemberMigrationSuccess(volume, newTarget);
      })
      .catch((e) => {
        notifyFailure(
          e,
          storageVolume.name,
          `Migration failed for volume ${volume.name} to target ${newTarget}`,
        );
      });
  };

  const handleClusterMemberMigration = (targetMember: string) => {
    setVolumeLoading(true);
    const failureMsg = `Migration failed for volume ${storageVolume.name} to target ${targetMember}`;
    copyCustomVolumeToTarget(storageVolume.project, storageVolume, targetMember)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => handleOldVolumeDeletion(storageVolume, targetMember),
          (err) => handleFailure(err, storageVolume.name, failureMsg),
          handleFinish,
        );
        const volume = (
          <ResourceLabel bold type="volume" value={storageVolume.name} />
        );
        toastNotify.info(
          <>
            Migration started for volume {volume} to {targetMember}
          </>,
        );
        void queryClient.invalidateQueries({
          queryKey: [queryKeys.storage, storageVolume.name, project],
        });
        handleClose();
      })
      .catch((e) => {
        notifyFailure(e, storageVolume.name, failureMsg);
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
            storageVolume={storageVolume}
          />
        </Portal>
      )}
      <ActionButton
        onClick={openPortal}
        type="button"
        className={classname}
        loading={isVolumeLoading}
        disabled={isVolumeLoading}
        title="Migrate volume"
      >
        <Icon name="machines" />
        <span>Migrate</span>
      </ActionButton>
    </>
  );
};

export default MigrateVolumeBtn;

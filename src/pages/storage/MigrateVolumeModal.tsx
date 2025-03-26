import { FC, KeyboardEvent, useState } from "react";
import { Modal } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchStoragePool } from "api/storage-pools";
import { useSettings } from "context/useSettings";
import { isClusteredServer } from "util/settings";
import BackLink from "components/BackLink";
import FormLink from "components/FormLink";
import Loader from "components/Loader";
import CustomVolumeClusterMemberMigration from "./CustomVolumeClusterMemberMigration";
import CustomVolumeStoragePoolMigration from "./CustomVolumeStoragePoolMigration";
import { LxdStorageVolume } from "types/storage";
import { isLocalPool } from "util/storagePool";
import { queryKeys } from "util/queryKeys";

interface Props {
  close: () => void;
  migrate: (
    targetPool: string | undefined,
    targetMember: string | undefined,
  ) => void;
  storageVolume: LxdStorageVolume;
}

const MigrateVolumeModal: FC<Props> = ({ close, migrate, storageVolume }) => {
  const { data: settings } = useSettings();
  const { data: pool, isLoading } = useQuery({
    queryKey: [queryKeys.storage, storageVolume.pool],
    queryFn: () => fetchStoragePool(storageVolume.pool),
  });

  const allowChooseMigrationType =
    isClusteredServer(settings) && isLocalPool(pool, settings);

  const [type, setType] = useState("");
  const [target, setTarget] = useState("");

  const handleEscKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      close();
    }
  };

  const handleGoBack = () => {
    // if incus is not clustered, we close the modal
    if (!allowChooseMigrationType) {
      close();
      return;
    }

    // if target is set, we are on the confirmation stage
    if (target) {
      setTarget("");
      return;
    }

    // if type is set, we are on migration target selection stage
    if (type) {
      setType("");
      return;
    }
  };

  const selectStepTitle = (
    <>
      Choose {type} for custom volume <strong>{storageVolume.name}</strong>
    </>
  );

  const modalTitle = !type ? (
    "Choose migration method"
  ) : (
    <>
      {allowChooseMigrationType && (
        <BackLink
          title={target ? "Confirm migration" : selectStepTitle}
          onClick={handleGoBack}
          linkText={target ? `Choose ${type}` : "Choose migration method"}
        />
      )}
      {!allowChooseMigrationType &&
        (target ? "Confirm migration" : selectStepTitle)}
    </>
  );

  return (
    <Modal
      close={close}
      className="migrate-instance-modal"
      title={modalTitle}
      onKeyDown={handleEscKey}
    >
      {isLoading && <Loader />}
      {!isLoading && allowChooseMigrationType && !type && (
        <div className="choose-migration-type">
          <FormLink
            icon="cluster-host"
            title="Migrate custom volume to a different cluster member"
            onClick={() => setType("cluster member")}
          />
          <FormLink
            icon="switcher-dashboard"
            title="Migrate custom volume to a different pool"
            onClick={() => setType("storage pool")}
          />
        </div>
      )}

      {!isLoading && type === "cluster member" && (
        <CustomVolumeClusterMemberMigration
          storageVolume={storageVolume}
          targetMember={target}
          onSelect={setTarget}
          close={handleGoBack}
          migrate={migrate}
        />
      )}

      {/* If incus is not clustered, we always show storage pool migration table */}
      {!isLoading && (type === "storage pool" || !allowChooseMigrationType) && (
        <CustomVolumeStoragePoolMigration
          storageVolume={storageVolume}
          targetPool={target}
          onSelect={setTarget}
          close={handleGoBack}
          migrate={migrate}
        />
      )}
    </Modal>
  );
};

export default MigrateVolumeModal;

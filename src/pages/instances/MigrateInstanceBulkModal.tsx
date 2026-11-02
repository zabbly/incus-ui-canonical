import type { FC, KeyboardEvent } from "react";
import { useState } from "react";
import { Modal } from "@canonical/react-components";
import type { LxdInstance } from "types/instance";
import FormLink from "components/FormLink";
import BackLink from "components/BackLink";
import InstanceBulkClusterMemberMigration from "./InstanceBulkClusterMemberMigration";
import InstanceBulkStoragePoolMigration from "./InstanceBulkStoragePoolMigration";
import InstanceBulkProjectMigration from "./InstanceBulkProjectMigration";
import type { BulkMigrationType } from "util/instanceBulkMigration";
import { useInstanceBulkMigration } from "util/instanceBulkMigration";
import { pluralize } from "util/helpers";
import { useIsClustered } from "context/useIsClustered";

interface Props {
  close: () => void;
  instances: LxdInstance[];
  onStart: (names: string[]) => void;
  onFinish: () => void;
}

const MigrateInstanceBulkModal: FC<Props> = ({
  close,
  instances,
  onStart,
  onFinish,
}) => {
  const isClustered = useIsClustered();
  const [type, setType] = useState<BulkMigrationType>("");
  const [target, setTarget] = useState("");
  const { handleMigrate, getMigratableInstances, canMoveProjectLive } =
    useInstanceBulkMigration({
      instances,
      type,
      close,
      onStart,
      onFinish,
    });

  const count = instances.length;

  const handleEscKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      close();
    }
  };

  const handleGoBack = () => {
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
      Choose {type} for <strong>{count}</strong> {pluralize("instance", count)}
    </>
  );

  const modalTitle = !type ? (
    "Choose migration method"
  ) : (
    <BackLink
      title={target ? "Confirm migration" : selectStepTitle}
      onClick={handleGoBack}
      linkText={target ? `Choose ${type}` : "Choose migration method"}
    />
  );

  return (
    <Modal
      close={close}
      className="migrate-instance-modal"
      onKeyDown={handleEscKey}
      aria-labelledby="migrate-title"
    >
      <header className="p-modal__header">
        <h2
          className="p-modal__title"
          key={type ? (target ? "confirm" : "select") : "start"}
          id="migrate-title"
        >
          {modalTitle}
        </h2>
        <button
          className="p-modal__close"
          aria-label="Close active modal"
          onClick={close}
        >
          Close
        </button>
      </header>
      {!type && (
        <div className="choose-migration-type">
          {isClustered && (
            <FormLink
              icon="cluster-host"
              title="Migrate instances to a different cluster member"
              onClick={() => {
                setType("cluster member");
              }}
            />
          )}
          <FormLink
            icon="storage-pool"
            title="Move instances root storage to a different pool"
            onClick={() => {
              setType("root storage pool");
            }}
          />
          <FormLink
            icon="folder"
            title="Move instances to a different project"
            onClick={() => {
              setType("project");
            }}
          />
        </div>
      )}

      {type === "cluster member" && (
        <InstanceBulkClusterMemberMigration
          instances={instances}
          onSelect={setTarget}
          targetMember={target}
          getMigratableInstances={getMigratableInstances}
          onCancel={handleGoBack}
          migrate={() => {
            handleMigrate(target, "", "");
          }}
        />
      )}

      {type === "root storage pool" && (
        <InstanceBulkStoragePoolMigration
          instances={instances}
          onSelect={setTarget}
          targetPool={target}
          getMigratableInstances={getMigratableInstances}
          onCancel={handleGoBack}
          migrate={(targetMember) => {
            handleMigrate(targetMember, target, "");
          }}
        />
      )}

      {type === "project" && (
        <InstanceBulkProjectMigration
          instances={instances}
          onSelect={setTarget}
          targetProject={target}
          getMigratableInstances={getMigratableInstances}
          canMoveProjectLive={canMoveProjectLive}
          onCancel={handleGoBack}
          migrate={(targetMember) => {
            handleMigrate(targetMember, "", target);
          }}
        />
      )}
    </Modal>
  );
};

export default MigrateInstanceBulkModal;

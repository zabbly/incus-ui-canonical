import { useState, type FC } from "react";
import { Modal } from "@canonical/react-components";
import type { LxdInstance } from "types/instance";
import FormLink from "components/FormLink";
import InstanceClusterMemberMigration from "./InstanceClusterMemberMigration";
import BackLink from "components/BackLink";
import InstanceStoragePoolMigration from "./InstanceStoragePoolMigration";
import {
  useInstanceMigration,
  type MigrationType,
} from "util/instanceMigration";
import InstanceProjectMigration from "pages/instances/InstanceProjectMigration";
import InstanceRemoteClusterMigration from "pages/instances/InstanceRemoteClusterMigration";
import { useIsClustered } from "context/useIsClustered";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import { getDependentDisks } from "util/dependentDisks";

interface Props {
  close: () => void;
  instance: LxdInstance;
}

const MigrateInstanceModal: FC<Props> = ({ close, instance }) => {
  const isClustered = useIsClustered();
  const [type, setType] = useState<MigrationType>("");
  const [target, setTarget] = useState("");
  // Root storage pool moves get an extra step for the dependent volume pools.
  const [volumesConfirmed, setVolumesConfirmed] = useState(false);
  const { hasDependentDisks } = useSupportedFeatures();
  const hasDependentStep =
    type === "root storage pool" &&
    hasDependentDisks &&
    getDependentDisks(instance).length > 0;
  const isVolumesStep = hasDependentStep && !!target && !volumesConfirmed;
  const { handleMigrate } = useInstanceMigration({
    close,
    instance,
    type,
  });

  const handleGoBack = () => {
    // from the confirmation stage back to the dependent volume pools stage
    if (volumesConfirmed) {
      setVolumesConfirmed(false);
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

  const selectStepTitle =
    type === "remote cluster" ? (
      <>
        Migrate instance <strong>{instance.name}</strong> to a remote cluster
      </>
    ) : (
      <>
        Choose {type} for instance <strong>{instance.name}</strong>
      </>
    );

  const modalTitle = !type ? (
    "Choose migration method"
  ) : isVolumesStep ? (
    <BackLink
      title={
        <>
          Choose pools for dependent volumes of <strong>{instance.name}</strong>
        </>
      }
      onClick={handleGoBack}
      linkText={`Choose ${type}`}
    />
  ) : (
    <BackLink
      title={target ? "Confirm migration" : selectStepTitle}
      onClick={handleGoBack}
      linkText={
        !target
          ? "Choose migration method"
          : hasDependentStep
            ? "Choose dependent volume pools"
            : `Choose ${type}`
      }
    />
  );

  return (
    <Modal
      close={close}
      className="migrate-instance-modal"
      aria-labelledby="migrate-title"
    >
      <header className="p-modal__header">
        <h2
          className="p-modal__title"
          key={
            type
              ? target
                ? isVolumesStep
                  ? "volumes"
                  : "confirm"
                : "select"
              : "start"
          }
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
              title="Migrate instance to a different cluster member"
              onClick={() => {
                setType("cluster member");
              }}
            />
          )}
          <FormLink
            icon="storage-pool"
            title="Move instance root storage to a different pool"
            onClick={() => {
              setType("root storage pool");
            }}
          />
          <FormLink
            icon="folder"
            title="Move instance to a different project"
            onClick={() => {
              setType("project");
            }}
          />
          <FormLink
            icon="machines"
            title="Migrate instance to a remote cluster"
            onClick={() => {
              setType("remote cluster");
            }}
          />
        </div>
      )}

      {type === "cluster member" && (
        <InstanceClusterMemberMigration
          instance={instance}
          onSelect={setTarget}
          targetMember={target}
          onCancel={handleGoBack}
          migrate={() => handleMigrate(target, "", "")}
        />
      )}

      {type === "root storage pool" && (
        <InstanceStoragePoolMigration
          instance={instance}
          onSelect={setTarget}
          targetPool={target}
          isVolumesStep={isVolumesStep}
          onConfirmVolumes={() => {
            setVolumesConfirmed(true);
          }}
          onCancel={handleGoBack}
          migrate={(targetMember, devices) => {
            handleMigrate(targetMember, target, "", devices);
          }}
        />
      )}

      {type === "project" && (
        <InstanceProjectMigration
          instance={instance}
          onSelect={setTarget}
          targetProject={target}
          onCancel={handleGoBack}
          migrate={(targetMember) => {
            handleMigrate(targetMember, "", target);
          }}
        />
      )}

      {type === "remote cluster" && (
        <InstanceRemoteClusterMigration
          instance={instance}
          onCancel={handleGoBack}
        />
      )}
    </Modal>
  );
};

export default MigrateInstanceModal;

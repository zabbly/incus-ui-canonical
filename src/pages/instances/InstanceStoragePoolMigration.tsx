import type { FC } from "react";
import { useEffect, useState } from "react";
import { ActionButton, Button, Select } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import StoragePoolSelectTable from "../storage/StoragePoolSelectTable";
import { fetchClusterMembers } from "api/cluster-members";
import type { LxdInstance } from "types/instance";
import { getRootPool } from "util/devices";
import { queryKeys } from "util/queryKeys";
import type { LxdDevices } from "types/device";
import { getDependentDisks, getVolumeName } from "util/dependentDisks";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import DependentDiskPoolMigration from "./DependentDiskPoolMigration";

interface Props {
  instance: LxdInstance;
  onSelect: (pool: string) => void;
  targetPool: string;
  isVolumesStep: boolean;
  onConfirmVolumes: () => void;
  onCancel: () => void;
  migrate: (targetMember: string, devices?: LxdDevices) => void;
}

const InstanceStoragePoolMigration: FC<Props> = ({
  instance,
  onSelect,
  targetPool,
  isVolumesStep,
  onConfirmVolumes,
  onCancel,
  migrate,
}) => {

  const enabledTargetMember = instance.type === 'virtual-machine' && instance.status === 'Running';
  const [targetMember, setTargetMember] = useState("");
  const { hasDependentDisks } = useSupportedFeatures();
  const dependentDisks = hasDependentDisks ? getDependentDisks(instance) : [];

  // Dependent volumes stay in their current pool unless a different pool is picked for them.
  const [dependentPoolOverrides, setDependentPoolOverrides] = useState<
    Record<string, string>
  >({});
  const dependentPools = Object.fromEntries(
    dependentDisks.map((disk) => [
      disk.name,
      dependentPoolOverrides[disk.name] ?? disk.device.pool ?? "",
    ]),
  );

  useEffect(() => {
    setDependentPoolOverrides({});
  }, [targetPool]);

  // Only the dependent disks changing pool are sent as device overrides.
  const getDeviceOverrides = (): LxdDevices | undefined => {
    const devices: LxdDevices = {};
    dependentDisks.forEach((disk) => {
      const pool = dependentPools[disk.name];
      if (pool && pool !== disk.device.pool) {
        devices[disk.name] = { ...disk.device, pool };
      }
    });
    return Object.keys(devices).length > 0 ? devices : undefined;
  };

  const { data: members = [], isLoading } = useQuery({
    queryKey: [queryKeys.cluster, queryKeys.members],
    queryFn: fetchClusterMembers,
    enabled: enabledTargetMember,
  });

  const memberOptions = members
    .filter((item) => item.server_name !== instance.location)
    .map((item) => {
      return { label: item.server_name , value: item.server_name };
    });

  useEffect(() => {
    if (memberOptions.length > 0 && !targetMember) {
      setTargetMember(memberOptions[0].value);
    }
  }, [memberOptions]);

  const summary = (
    <>
      <div className="migrate-instance-summary">
        <p>
          This will migrate the instance <strong>{instance.name}</strong> root
          storage to pool <b>{targetPool}</b>.
          {enabledTargetMember && (<> Select target server:
          <Select options={memberOptions} onChange={(e) => setTargetMember(e.target.value)}/></>)}
        </p>
      </div>
      {dependentDisks.length > 0 && (
        <div className="migrate-dependent-disks">
          <p className="u-no-margin--bottom">Dependent volumes:</p>
          <ul className="migrate-dependent-disks-summary">
            {dependentDisks.map((disk) => (
              <li key={disk.name}>
                <b>{disk.name}</b> volume{" "}
                <b>{getVolumeName(disk.device.source)}</b>:{" "}
                {dependentPools[disk.name] === disk.device.pool ? (
                  <>
                    stays in pool <b>{disk.device.pool}</b>
                  </>
                ) : (
                  <>
                    <b>{disk.device.pool}</b> →{" "}
                    <b>{dependentPools[disk.name]}</b>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <>
      {targetPool && !isVolumesStep && summary}
      {targetPool && isVolumesStep && (
        <DependentDiskPoolMigration
          disks={dependentDisks}
          pools={dependentPools}
          setPool={(disk, pool) => {
            setDependentPoolOverrides((prev) => ({ ...prev, [disk]: pool }));
          }}
        />
      )}
      {!targetPool && (
        <StoragePoolSelectTable
          onSelect={onSelect}
          disablePool={{
            name: getRootPool(instance),
            reason: "Instance root storage already in this pool",
          }}
        />
      )}
      <footer id="migrate-instance-actions" className="p-modal__footer">
        <Button
          className="u-no-margin--bottom"
          type="button"
          aria-label="cancel migrate"
          appearance="base"
          onClick={onCancel}
        >
          Cancel
        </Button>
        {isVolumesStep ? (
          <Button
            appearance="positive"
            className="u-no-margin--bottom"
            type="button"
            onClick={onConfirmVolumes}
          >
            Next
          </Button>
        ) : (
          <ActionButton
            appearance="positive"
            className="u-no-margin--bottom"
            onClick={() => {
              migrate(targetMember, getDeviceOverrides());
            }}
            disabled={!targetPool}
          >
            Migrate
          </ActionButton>
        )}
      </footer>
    </>
  );
};

export default InstanceStoragePoolMigration;

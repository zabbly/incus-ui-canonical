import { FC, useEffect, useState } from "react";
import { ActionButton, Button, Select } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import StoragePoolSelectTable from "../storage/StoragePoolSelectTable";
import { fetchClusterMembers } from "api/cluster";
import { LxdInstance } from "types/instance";
import { getRootPool } from "util/helpers";
import { queryKeys } from "util/queryKeys";

interface Props {
  instance: LxdInstance;
  onSelect: (pool: string) => void;
  targetPool: string;
  onCancel: () => void;
  migrate: (targetMember: string) => void;
  isClustered: boolean;
}

const InstanceStoragePoolMigration: FC<Props> = ({
  instance,
  onSelect,
  targetPool,
  onCancel,
  migrate,
  isClustered,
}) => {

  const enabledTargetMember = isClustered && instance.type === 'virtual-machine' && instance.status === 'Running';
  const [targetMember, setTargetMember] = useState("");

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
    <div className="migrate-instance-summary">
      <p>
        This will migrate the instance <strong>{instance.name}</strong> root
        storage to pool <b>{targetPool}</b>.
        {enabledTargetMember && (<> Select target server:
        <Select options={memberOptions} onChange={(e) => setTargetMember(e.target.value)}/></>)}
      </p>
    </div>
  );

  return (
    <>
      {targetPool && summary}
      {!targetPool && (
        <StoragePoolSelectTable
          onSelect={onSelect}
          disablePool={{
            name: getRootPool(instance),
            reason: "Instance root storage already in this pool",
          }}
        />
      )}
      {(isClustered || targetPool) && (
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
          <ActionButton
            appearance="positive"
            className="u-no-margin--bottom"
            onClick={() => migrate(targetMember)}
            disabled={!targetPool}
          >
            Migrate
          </ActionButton>
        </footer>
      )}
    </>
  );
};

export default InstanceStoragePoolMigration;

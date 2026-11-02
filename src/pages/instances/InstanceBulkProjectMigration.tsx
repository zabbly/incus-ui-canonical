import { type FC, useEffect, useState } from "react";
import { ActionButton, Button, Select } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import type { LxdInstance } from "types/instance";
import ProjectSelectTable from "pages/projects/ProjectSelectTable";
import { fetchClusterMembers } from "api/cluster-members";
import { pluralize } from "util/helpers";
import { queryKeys } from "util/queryKeys";

interface Props {
  instances: LxdInstance[];
  onSelect: (project: string) => void;
  targetProject: string;
  getMigratableInstances: (
    targetMember: string,
    targetPool: string,
    targetProject: string,
  ) => LxdInstance[];
  canMoveProjectLive: boolean;
  onCancel: () => void;
  migrate: (targetMember: string) => void;
}

const InstanceBulkProjectMigration: FC<Props> = ({
  instances,
  onSelect,
  targetProject,
  getMigratableInstances,
  canMoveProjectLive,
  onCancel,
  migrate,
}) => {
  // Running VMs change project through a live migration to another cluster
  // member, so we offer a member picker when any running VM is selected.
  const hasLiveInstances =
    canMoveProjectLive &&
    instances.some(
      (instance) =>
        instance.type === "virtual-machine" && instance.status === "Running",
    );
  const [targetMember, setTargetMember] = useState("");

  const { data: members = [] } = useQuery({
    queryKey: [queryKeys.cluster, queryKeys.members],
    queryFn: fetchClusterMembers,
    enabled: hasLiveInstances,
  });

  const memberOptions = members.map((item) => {
    return { label: item.server_name, value: item.server_name };
  });

  useEffect(() => {
    if (memberOptions.length > 0 && !targetMember) {
      setTargetMember(memberOptions[0].value);
    }
  }, [memberOptions]);

  const migratableCount = getMigratableInstances(
    targetMember,
    "",
    targetProject,
  ).length;
  const skippedCount = instances.length - migratableCount;

  const summary = (
    <div className="migrate-instance-summary">
      <p>
        This will migrate <strong>{migratableCount}</strong>{" "}
        {pluralize("instance", migratableCount)} to the project{" "}
        <b>{targetProject}</b>.
        {skippedCount > 0 && (
          <>
            {" "}
            <strong>{skippedCount}</strong>{" "}
            {pluralize("instance", skippedCount)} will be skipped (already in
            this project, running and not movable live, or already on the target
            server).
          </>
        )}
        {hasLiveInstances && memberOptions.length > 0 && (
          <>
            {" "}
            Select target server for live migrations:
            <Select
              options={memberOptions}
              value={targetMember}
              onChange={(e) => {
                setTargetMember(e.target.value);
              }}
            />
          </>
        )}
      </p>
    </div>
  );

  return (
    <>
      {targetProject && summary}
      {!targetProject && <ProjectSelectTable onSelect={onSelect} />}
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
          onClick={() => {
            migrate(targetMember);
          }}
          disabled={!targetProject || migratableCount === 0}
        >
          Migrate
        </ActionButton>
      </footer>
    </>
  );
};

export default InstanceBulkProjectMigration;

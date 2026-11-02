import { type FC, useEffect, useState } from "react";
import {
  ActionButton,
  Button,
  Notification,
  Select,
} from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import type { LxdInstance } from "types/instance";
import ProjectSelectTable from "pages/projects/ProjectSelectTable";
import { fetchClusterMembers } from "api/cluster-members";
import { useSettings } from "context/useSettings";
import { useIsClustered } from "context/useIsClustered";
import { queryKeys } from "util/queryKeys";

interface Props {
  instance: LxdInstance;
  onSelect: (pool: string) => void;
  targetProject: string;
  onCancel: () => void;
  migrate: (targetMember: string) => void;
}

const InstanceProjectMigration: FC<Props> = ({
  instance,
  onSelect,
  targetProject,
  onCancel,
  migrate,
}) => {
  const { data: settings } = useSettings();
  const isClustered = useIsClustered();
  const hasLiveProjectMove = !!settings?.api_extensions?.includes(
    "instance_project_move_live",
  );

  // A running instance can only change project through a live migration to
  // another cluster member, which is supported for VMs only.
  const isRunning = instance.status === "Running";
  const canMoveLive =
    isRunning &&
    instance.type === "virtual-machine" &&
    isClustered &&
    hasLiveProjectMove;
  const isBlocked = isRunning && !canMoveLive;

  const [targetMember, setTargetMember] = useState("");

  const { data: members = [] } = useQuery({
    queryKey: [queryKeys.cluster, queryKeys.members],
    queryFn: fetchClusterMembers,
    enabled: canMoveLive,
  });

  const memberOptions = members
    .filter((item) => item.server_name !== instance.location)
    .map((item) => {
      return { label: item.server_name, value: item.server_name };
    });

  useEffect(() => {
    if (memberOptions.length > 0 && !targetMember) {
      setTargetMember(memberOptions[0].value);
    }
  }, [memberOptions]);

  const getBlockedReason = () => {
    if (instance.type !== "virtual-machine") {
      return "Running containers can't be moved to another project. Stop the instance first.";
    }
    if (!isClustered) {
      return "Running instances can only be moved to another project on a cluster. Stop the instance first.";
    }
    return "The server doesn't support moving running instances to another project. Stop the instance first.";
  };

  const summary = (
    <div className="migrate-instance-summary">
      <p>
        This will migrate the instance <strong>{instance.name}</strong> to the
        project <b>{targetProject}</b>.
        {canMoveLive && memberOptions.length > 0 && (
          <>
            {" "}
            Running instances are moved live to another cluster member. Select
            target server:
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
      {canMoveLive && memberOptions.length === 0 && (
        <Notification severity="caution" title="No target server">
          A running instance needs another cluster member to move to.
        </Notification>
      )}
      {isBlocked && (
        <Notification severity="caution" title="Instance is running">
          {getBlockedReason()}
        </Notification>
      )}
    </div>
  );

  return (
    <>
      {targetProject && summary}
      {!targetProject && (
        <ProjectSelectTable
          onSelect={onSelect}
          disableProject={{
            name: instance.project,
            reason: "Instance already in this project",
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
        <ActionButton
          appearance="positive"
          className="u-no-margin--bottom"
          onClick={() => {
            migrate(canMoveLive ? targetMember : "");
          }}
          disabled={
            !targetProject || isBlocked || (canMoveLive && !targetMember)
          }
        >
          Migrate
        </ActionButton>
      </footer>
    </>
  );
};

export default InstanceProjectMigration;

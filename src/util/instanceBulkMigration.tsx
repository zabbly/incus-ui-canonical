import { useQueryClient } from "@tanstack/react-query";
import { useEventQueue } from "context/eventQueue";
import { queryKeys } from "./queryKeys";
import { migrateInstanceBulk } from "api/instances";
import type { LxdInstance } from "types/instance";
import { getRootPool, pluralize } from "util/helpers";
import { getPromiseSettledCounts } from "util/promises";
import { useToastNotification } from "@canonical/react-components";
import { useBulkDetails } from "context/useBulkDetails";
import { useInstanceEntitlements } from "util/entitlements/instances";
import { useSettings } from "context/useSettings";
import { useIsClustered } from "context/useIsClustered";

export type BulkMigrationType =
  | "cluster member"
  | "root storage pool"
  | "project"
  | "";

const isLiveInstance = (instance: LxdInstance) =>
  instance.type === "virtual-machine" && instance.status === "Running";

interface Props {
  instances: LxdInstance[];
  type: BulkMigrationType;
  close: () => void;
  onStart: (names: string[]) => void;
  onFinish: () => void;
}

export const useInstanceBulkMigration = ({
  instances,
  type,
  close,
  onStart,
  onFinish,
}: Props) => {
  const eventQueue = useEventQueue();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const viewBulkDetails = useBulkDetails();
  const { canEditInstance } = useInstanceEntitlements();
  const { data: settings } = useSettings();
  const isClustered = useIsClustered();

  // Running VMs can change project through a live migration to another cluster
  // member. Other running instances must be stopped first.
  const canMoveProjectLive =
    isClustered &&
    !!settings?.api_extensions?.includes("instance_project_move_live");

  // Instances that the user can migrate and that are not already on the chosen
  // target.
  const getMigratableInstances = (
    targetMember: string,
    targetPool: string,
    targetProject: string,
  ): LxdInstance[] => {
    return instances.filter(canEditInstance).filter((instance) => {
      if (type === "cluster member") {
        return instance.location !== targetMember;
      }
      if (type === "project") {
        if (instance.project === targetProject) {
          return false;
        }
        if (instance.status === "Running") {
          return (
            canMoveProjectLive &&
            isLiveInstance(instance) &&
            !!targetMember &&
            instance.location !== targetMember
          );
        }
        return true;
      }
      if (type === "root storage pool") {
        if (getRootPool(instance) === targetPool) {
          return false;
        }
        // Live VMs also move to the chosen target member; skip the ones that
        // are already on it.
        if (isLiveInstance(instance) && targetMember) {
          return instance.location !== targetMember;
        }
        return true;
      }
      return false;
    });
  };

  const handleMigrate = (
    targetMember: string,
    targetPool: string,
    targetProject: string,
  ) => {
    const migratableInstances = getMigratableInstances(
      targetMember,
      targetPool,
      targetProject,
    );
    const count = migratableInstances.length;

    if (count === 0) {
      toastNotify.info(
        "No instances to migrate, all selected instances are already on the chosen target.",
      );
      close();
      return;
    }

    onStart(migratableInstances.map((item) => item.name));

    // migrateInstanceBulk never resolves for an empty list.
    const migrateSubset = async (subset: LxdInstance[], member: string) =>
      subset.length > 0
        ? migrateInstanceBulk(
            subset,
            member,
            targetPool,
            targetProject,
            eventQueue,
          )
        : Promise.resolve([]);

    // For project moves only live VMs go to the target member, stopped
    // instances stay on their current member.
    const migration =
      type === "project"
        ? Promise.all([
            migrateSubset(
              migratableInstances.filter(isLiveInstance),
              targetMember,
            ),
            migrateSubset(
              migratableInstances.filter((item) => !isLiveInstance(item)),
              "",
            ),
          ]).then(([live, stopped]) => [...live, ...stopped])
        : migrateInstanceBulk(
            migratableInstances,
            targetMember,
            targetPool,
            targetProject,
            eventQueue,
          );

    migration
      .then((results) => {
        const { fulfilledCount, rejectedCount } =
          getPromiseSettledCounts(results);
        if (fulfilledCount === count) {
          toastNotify.success(
            <>
              <b>{count}</b> {pluralize("instance", count)} migrated.
            </>,
            viewBulkDetails(results),
          );
        } else if (rejectedCount === count) {
          toastNotify.failure(
            "Instance migration failed",
            undefined,
            <>
              <b>{count}</b> {pluralize("instance", count)} could not be
              migrated.
            </>,
            viewBulkDetails(results),
          );
        } else {
          toastNotify.failure(
            "Instance migration partially failed",
            undefined,
            <>
              <b>{fulfilledCount}</b> {pluralize("instance", fulfilledCount)}{" "}
              migrated.
              <br />
              <b>{rejectedCount}</b> {pluralize("instance", rejectedCount)}{" "}
              could not be migrated.
            </>,
            viewBulkDetails(results),
          );
        }
        queryClient.invalidateQueries({
          queryKey: [queryKeys.instances],
        });
        onFinish();
      })
      .catch((e) => {
        toastNotify.failure("Instance migration failed", e);
        onFinish();
      });

    close();
  };

  return {
    handleMigrate,
    getMigratableInstances,
    canMoveProjectLive,
  };
};

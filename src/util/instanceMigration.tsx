import { useQueryClient } from "@tanstack/react-query";
import { useEventQueue } from "context/eventQueue";
import { useInstanceLoading } from "context/instanceLoading";
import { queryKeys } from "./queryKeys";
import { migrateInstance } from "api/instances";
import type { LxdInstance } from "types/instance";
import type { ReactNode } from "react";
import { capitalizeFirstLetter } from "./helpers";
import ResourceLink from "components/ResourceLink";
import InstanceLinkChip from "pages/instances/InstanceLinkChip";
import { useNavigate } from "react-router-dom";
import { useToastNotification } from "@canonical/react-components";

export type MigrationType =
  | "cluster member"
  | "root storage pool"
  | "project"
  | "";

interface Props {
  instance: LxdInstance;
  type: MigrationType;
  close: () => void;
  onSuccess: () => void;
}

export const useInstanceMigration = ({
  instance,
  close,
  type,
}: Props) => {
  const toastNotify = useToastNotification();
  const instanceLoading = useInstanceLoading();
  const eventQueue = useEventQueue();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSuccess = (target: string) => {
    let successMessage: ReactNode = "";
    if (type === "cluster member") {
      successMessage = (
        <>
          Instance <InstanceLinkChip instance={instance} /> successfully
          migrated to cluster member{" "}
          <ResourceLink
            type="cluster-member"
            value={target}
            to={`/ui/cluster/member/${encodeURIComponent(target)}`}
          />
        </>
      );
    }

    if (type === "root storage pool") {
      successMessage = (
        <>
          Instance <InstanceLinkChip instance={instance} /> root storage
          successfully moved to pool{" "}
          <ResourceLink
            type="pool"
            value={target}
            to={`/ui/project/${encodeURIComponent(instance.project)}/storage/pool/${encodeURIComponent(target)}`}
          />
        </>
      );
    }

    if (type === "project") {
      successMessage = (
        <>
          Instance{" "}
          <InstanceLinkChip instance={{ ...instance, project: target }} />
          successfully moved to project{" "}
          <ResourceLink
            type="project"
            value={target}
            to={`/ui/project/${encodeURIComponent(target)}`}
          />
        </>
      );

      const oldUrl = window.location.pathname;
      const newUrl = oldUrl.replace(
        `/project/${instance.project}/instance/${instance.name}`,
        `/project/${target}/instance/${instance.name}`,
      );
      if (oldUrl !== newUrl) {
        navigate(newUrl);
      }
    }

    toastNotify.success(successMessage);
  };

  const notifyFailure = (e: unknown) => {
    let failureMessage = "";
    if (type === "cluster member") {
      failureMessage = `Cluster member migration failed for instance ${instance.name}`;
    }

    if (type === "root storage pool") {
      failureMessage = `Root storage move failed for instance ${instance.name}`;
    }

    if (type === "project") {
      failureMessage = `Project move failed for instance ${instance.name}`;
    }

    instanceLoading.setFinish(instance);
    toastNotify.failure(
      failureMessage,
      e,
      <InstanceLinkChip instance={instance} />,
    );
  };

  const handleFailure = (msg: string) => {
    notifyFailure(new Error(msg));
  };

  const handleFinish = () => {
    queryClient.invalidateQueries({
      queryKey: [queryKeys.instances, instance.name, instance.project],
    });
    instanceLoading.setFinish(instance);
  };

  const handleMigrate = (targetMember: string, targetPool: string, targetProject: string) => {
    let target = "";
    if (type === "cluster member") {
      target = targetMember;
    } else if (type === "root storage pool" ) {
      target = targetPool;
    } else if (type === "project" ) {
      target = targetProject;
    }
    instanceLoading.setLoading(instance, "Migrating");
    migrateInstance(instance, targetMember, targetPool, targetProject)
      .then((operation) => {
        eventQueue.set(
          operation.metadata.id,
          () => {
            handleSuccess(target);
          },
          (err) => {
            handleFailure(err);
          },
          handleFinish,
        );
        toastNotify.info(
          <>
            {capitalizeFirstLetter(type)} migration started for{" "}
            <InstanceLinkChip instance={instance} />.
          </>,
        );
        queryClient.invalidateQueries({
          queryKey: [queryKeys.instances, instance.name, instance.project],
        });
      })
      .catch((e) => {
        notifyFailure(e);
      })
      .finally(() => {
        close();
      });
  };

  return {
    handleMigrate,
  };
};

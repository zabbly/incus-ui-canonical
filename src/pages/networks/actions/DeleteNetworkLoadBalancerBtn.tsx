import type { FC } from "react";
import { useState } from "react";
import type { LxdNetwork, LxdNetworkLoadBalancer } from "types/network";
import { queryKeys } from "util/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import {
  ConfirmationButton,
  Icon,
  useNotify,
  useToastNotification,
} from "@canonical/react-components";
import { deleteNetworkLoadBalancer } from "api/network-load-balancers";
import { useNetworkEntitlements } from "util/entitlements/networks";

interface Props {
  network: LxdNetwork;
  loadBalancer: LxdNetworkLoadBalancer;
  project: string;
}

const DeleteNetworkLoadBalancerBtn: FC<Props> = ({
  network,
  loadBalancer,
  project,
}) => {
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const [isLoading, setLoading] = useState(false);
  const { canEditNetwork } = useNetworkEntitlements();

  const handleDelete = () => {
    setLoading(true);
    deleteNetworkLoadBalancer(network, loadBalancer, project)
      .then(() => {
        toastNotify.success(
          `Network load balancer with listen address ${loadBalancer.listen_address} deleted.`,
        );
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === queryKeys.projects &&
            query.queryKey[1] === project &&
            query.queryKey[2] === queryKeys.networks &&
            query.queryKey[3] === network.name,
        });
      })
      .catch((e) => {
        setLoading(false);
        notify.failure("Network load balancer deletion failed", e);
      });
  };

  return (
    <ConfirmationButton
      appearance="base"
      onHoverText={
        canEditNetwork(network)
          ? "Delete network load balancer"
          : "You do not have permission to delete this network load balancer"
      }
      confirmationModalProps={{
        title: "Confirm delete",
        confirmButtonAppearance: "negative",
        confirmButtonLabel: "Delete",
        children: (
          <p>
            Are you sure you want to delete the network load balancer with
            listen address {loadBalancer.listen_address}?<br />
          </p>
        ),
        onConfirm: handleDelete,
      }}
      className="u-no-margin--bottom has-icon"
      loading={isLoading}
      shiftClickEnabled
      showShiftClickHint
      disabled={!canEditNetwork(network) || isLoading}
    >
      <Icon name="delete" />
    </ConfirmationButton>
  );
};

export default DeleteNetworkLoadBalancerBtn;

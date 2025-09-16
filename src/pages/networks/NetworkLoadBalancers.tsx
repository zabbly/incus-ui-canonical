import type { FC } from "react";
import {
  Button,
  EmptyState,
  Icon,
  MainTable,
  Row,
  useNotify,
} from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import type { LxdNetwork } from "types/network";
import Loader from "components/Loader";
import { fetchNetworkLoadBalancers } from "api/network-load-balancers";
import { useDocs } from "context/useDocs";
import DeleteNetworkLoadBalancerBtn from "pages/networks/actions/DeleteNetworkLoadBalancerBtn";
import { Link } from "react-router-dom";
import ExpandableList from "components/ExpandableList";
import NetworkLoadBalancerPort from "pages/networks/NetworkLoadBalancerPort";
import ScrollableTable from "components/ScrollableTable";
import { useNetworkEntitlements } from "util/entitlements/networks";
import ResourceLink from "components/ResourceLink";
import { bridgeType } from "util/networks";

interface Props {
  network: LxdNetwork;
  project: string;
}

const NetworkLoadBalancers: FC<Props> = ({ network, project }) => {
  const docBaseLink = useDocs();
  const notify = useNotify();
  const { canEditNetwork } = useNetworkEntitlements();

  const {
    data: loadBalancers = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: [
      queryKeys.projects,
      project,
      queryKeys.networks,
      network.name,
      queryKeys.loadBalancers,
    ],
    queryFn: async () => fetchNetworkLoadBalancers(network.name, project),
  });

  if (error) {
    notify.failure("Loading network load balancers failed", error);
  }

  const hasNetworkLoadBalancers = loadBalancers.length > 0;

  const headers = [
    { content: "Listen address", sortKey: "listenAddress" },
    { content: "Description", sortKey: "description" },
    { content: "Ports" },
    {
      "aria-label": "Actions",
      className: "u-align--right actions",
    },
  ];

  const rows = loadBalancers.map((loadBalancer) => {
    return {
      key: loadBalancer.listen_address,
      columns: [
        {
          content: loadBalancer.listen_address,
          role: "rowheader",
          "aria-label": "Listen address",
        },
        {
          content: loadBalancer.description,
          role: "cell",
          "aria-label": "Description",
        },
        {
          content: (
            <ExpandableList
              items={
                loadBalancer.ports?.map((port) => (
                  <NetworkLoadBalancerPort key={port.listen_port} port={port} />
                )) ?? []
              }
            />
          ),
          role: "cell",
          "aria-label": "Forwarded ports",
        },
        {
          content: (
            <>
              {canEditNetwork(network) && (
                <Link
                  className="p-button--base u-no-margin--bottom has-icon"
                  to={`/ui/project/${encodeURIComponent(project)}/network/${encodeURIComponent(network.name)}/load-balancers/${encodeURIComponent(loadBalancer.listen_address)}/edit`}
                  title="Edit network load balancer"
                >
                  <Icon name="edit" />
                </Link>
              )}
              {!canEditNetwork(network) && (
                <Button
                  key="edit"
                  appearance="base"
                  className="u-no-margin--bottom"
                  dense
                  hasIcon
                  type="button"
                  title="You do not have permission to edit load balancers for this network"
                  disabled
                >
                  <Icon name="edit" />
                </Button>
              )}
              <DeleteNetworkLoadBalancerBtn
                key={loadBalancer.listen_address}
                network={network}
                loadBalancer={loadBalancer}
                project={project}
              />
            </>
          ),
          role: "cell",
          className: "u-align--right actions",
          "aria-label": "Actions",
        },
      ],
      sortData: {
        listenAddress: loadBalancer.listen_address,
        description: loadBalancer.description,
      },
    };
  });

  if (isLoading) {
    return <Loader isMainComponent />;
  }

  return (
    <>
      {canEditNetwork(network) && (
        <Link
          className="p-button--positive u-no-margin--bottom u-float-right"
          to={`/ui/project/${encodeURIComponent(project)}/network/${encodeURIComponent(network.name)}/load-balancers/create`}
        >
          Create load balancer
        </Link>
      )}
      {!canEditNetwork(network) && (
        <Button
          appearance="positive"
          className="u-float-right u-no-margin--bottom"
          disabled
          title="You do not have permission to create network load balancers for this network"
        >
          <span>Create load balancer</span>
        </Button>
      )}
      <Row>
        {hasNetworkLoadBalancers && (
          <ScrollableTable
            dependencies={loadBalancers}
            tableId="network-loadbalancers-table"
            belowIds={["status-bar"]}
          >
            <MainTable
              id="network-load-balancers-table"
              headers={headers}
              expanding
              rows={rows}
              paginate={30}
              sortable
              defaultSort="listenAddress"
              defaultSortDirection="ascending"
              className="u-table-layout--auto network-load-balancers-table"
              emptyStateMsg="No data to display"
            />
          </ScrollableTable>
        )}
        {!isLoading && !hasNetworkLoadBalancers && (
          <EmptyState
            className="empty-state"
            image={<Icon className="empty-state-icon" name="exposed" />}
            title="No network load balancers found"
          >
            <p>There are no network load balancers in this project.</p>
            <p>
              <a
                href={`${docBaseLink}/howto/network_load_balancers/`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about network load balancers
                <Icon className="external-link-icon" name="external-link" />
              </a>
            </p>
          </EmptyState>
        )}
      </Row>
    </>
  );
};

export default NetworkLoadBalancers;

import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { useParams } from "react-router-dom";
import { fetchNetworkAcl } from "api/networks";
import NotificationRow from "components/NotificationRow";
import EditNetworkAcl from "pages/networks/EditNetworkAcl";
import NetworkAclDetailHeader from "pages/networks/NetworkAclDetailHeader";
import Loader from "components/Loader";
import { Row } from "@canonical/react-components";
import NetworkAclDetailOverview from "pages/networks/NetworkAclDetailOverview";
import NetworkAclRules from "pages/networks/NetworkAclRules";
import CustomLayout from "components/CustomLayout";
import TabLinks from "components/TabLinks";

const NetworkAclDetail: FC = () => {
  const { name, project, activeTab } = useParams<{
    name: string;
    project: string;
    activeTab?: string;
  }>();

  if (!name) {
    return <>Missing name</>;
  }

  if (!project) {
    return <>Missing project</>;
  }

  const { data: acl, isLoading } = useQuery({
    queryKey: [queryKeys.projects, project, queryKeys.networkAcls, name],
    queryFn: () => fetchNetworkAcl(name, project),
  });

  if (isLoading) {
    return <Loader />;
  }

  const getTabs = () => {
    return ["Overview", "Configuration", "Ingress", "Egress"];
  };

  return (
    <CustomLayout
      header={
        <NetworkAclDetailHeader acl={acl} project={project} name={name} />
      }
      contentClassName="edit-network"
    >
      <Row>
        <TabLinks
          tabs={getTabs()}
          activeTab={activeTab}
          tabUrl={`/ui/project/${project}/network-acls/${name}`}
        />
        <NotificationRow />
        {!activeTab && (
          <div role="tabpanel" aria-labelledby="overview">
            {acl && <NetworkAclDetailOverview acl={acl} />}
          </div>
        )}
        {activeTab === "configuration" && (
          <div role="tabpanel" aria-labelledby="configuration">
            {acl && <EditNetworkAcl acl={acl} project={project} />}
          </div>
        )}
        {activeTab === "ingress" && (
          <div role="tabpanel" aria-labelledby="ingress">
            {acl && <NetworkAclRules acl={acl} type="ingress" project={project} />}
          </div>
        )}
        {activeTab === "egress" && (
          <div role="tabpanel" aria-labelledby="egress">
            {acl && <NetworkAclRules acl={acl} type="egress" project={project} />}
          </div>
        )}
      </Row>
    </CustomLayout>
  );
};

export default NetworkAclDetail;

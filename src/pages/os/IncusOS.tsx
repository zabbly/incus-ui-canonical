import type { ChangeEvent, FC } from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Row, CustomLayout } from "@canonical/react-components";
import type { TabLink } from "@canonical/react-components/dist/components/Tabs/Tabs";
import TabLinks from "components/TabLinks";
import { useClusterMembers } from "context/useClusterMembers";
import OSOverview from "./OSOverview";
import OSApplications from "./OSApplications";
import OSApplicationDetails from "./OSApplicationDetails";
import OSDebug from "./OSDebug";
import OSLicenses from "./OSLicenses";
import OSLicenseDetails from "./OSLicenseDetails";
import OSServices from "./OSServices";
import OSServiceDetails from "./OSServiceDetails";
import OSSystem from "./OSSystem";
import ClusterMemberSelector from "pages/cluster/ClusterMemberSelector";
import OSActions from "pages/os/actions/OSActions";

const tabs: string[] = [
  "Overview",
  "Applications",
  "Debug",
  "Licenses",
  "Services",
  "System",
];

const IncusOS: FC = () => {
  const renderTabs: (string | TabLink)[] = [...tabs];
  const { activeTab, itemName } = useParams<{
    activeTab?: string;
    itemName?: string;
  }>();
  const [currentMember, setCurrentMember] = useState<string>("");
  const { data: clusterMembers = [] } = useClusterMembers();

  useEffect(() => {
    if (clusterMembers.length < 1) return;
    if (currentMember !== "") return;

    setCurrentMember(clusterMembers[0].server_name);
  }, [currentMember, clusterMembers]);

  const onMemberChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCurrentMember(e.target.value);
  };

  return (
    <CustomLayout
      header={
        <div className="p-panel__header page-header">
          <div className="page-header__left">
            <h1 className="p-heading--4 u-no-margin--bottom">Incus OS</h1>
            <ClusterMemberSelector label="" onChange={onMemberChange} />
            <OSActions target={currentMember} />
          </div>
          <div className="page-header__search margin-right u-no-margin--bottom"></div>
        </div>
      }
      contentClassName="detail-page"
    >
      <Row>
        <TabLinks tabs={renderTabs} activeTab={activeTab} tabUrl={`/ui/os`} />

        {!activeTab && (
          <div role="tabpanel" aria-labelledby="overview">
            <OSOverview target={currentMember} />
          </div>
        )}

        {activeTab === "applications" && !itemName && (
          <div role="tabpanel" aria-labelledby="applications">
            <OSApplications target={currentMember} />
          </div>
        )}

        {activeTab === "applications" && itemName && (
          <div role="tabpanel" aria-labelledby="applications">
            <OSApplicationDetails name={itemName} target={currentMember} />
          </div>
        )}

        {activeTab === "debug" && (
          <div role="tabpanel" aria-labelledby="debug">
            <OSDebug subTab={itemName} target={currentMember} />
          </div>
        )}

        {activeTab === "licenses" && !itemName && (
          <div role="tabpanel" aria-labelledby="licenses">
            <OSLicenses target={currentMember} />
          </div>
        )}

        {activeTab === "licenses" && itemName && (
          <div role="tabpanel" aria-labelledby="licenses">
            <OSLicenseDetails name={itemName} target={currentMember} />
          </div>
        )}

        {activeTab === "services" && !itemName && (
          <div role="tabpanel" aria-labelledby="services">
            <OSServices target={currentMember} />
          </div>
        )}

        {activeTab === "services" && itemName && (
          <div role="tabpanel" aria-labelledby="services">
            <OSServiceDetails name={itemName} target={currentMember} />
          </div>
        )}

        {activeTab === "system" && (
          <div role="tabpanel" aria-labelledby="system">
            <OSSystem subTab={itemName} target={currentMember} />
          </div>
        )}
      </Row>
    </CustomLayout>
  );
};

export default IncusOS;

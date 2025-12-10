import type { FC } from "react";
import { useEffect } from "react";
import { isoTimeToString } from "util/helpers";
import { Col, Row, useNotify } from "@canonical/react-components";
import type { LxdInstance } from "types/instance";
import { instanceCreationTypes } from "util/instanceOptions";
import useEventListener from "util/useEventListener";
import { updateMaxHeight } from "util/updateMaxHeight";
import InstanceOverviewProfiles from "./InstanceOverviewProfiles";
import InstanceOverviewUserProperties from "./InstanceOverviewUserProperties";
import InstanceOverviewMetrics from "./InstanceOverviewMetrics";
import InstancePreview from "./InstancePreview";
import InstanceIps from "pages/instances/InstanceIps";
import InstanceMAC from "pages/instances/InstanceMAC";
import { useSettings } from "context/useSettings";
import NotificationRow from "components/NotificationRow";
import DeviceListTable from "components/DeviceListTable";
import NetworkListTable from "components/NetworkListTable";
import type { LxdDevices } from "types/device";
import ResourceLink from "components/ResourceLink";
import { getIpAddresses } from "util/networks";
import { getImageLink } from "util/instances";

interface Props {
  instance: LxdInstance;
}

const InstanceOverview: FC<Props> = ({ instance }) => {
  const notify = useNotify();
  const { data: settings } = useSettings();

  const onFailure = (title: string, e: unknown) => {
    notify.failure(title, e);
  };

  const updateContentHeight = () => {
    updateMaxHeight("instance-overview-tab");
  };
  useEffect(updateContentHeight, [notify.notification?.message]);
  useEventListener("resize", updateContentHeight);

  const pid =
    !instance.state || instance.state.pid === 0 ? "-" : instance.state.pid;
  const isVm = instance.type === "virtual-machine";

  return (
    <div className="instance-overview-tab">
      <NotificationRow />
      <Row className="general">
        <Col size={3}>
          <h2 className="p-heading--5">General</h2>
        </Col>
        <Col size={7}>
          <table>
            <tbody>
              <tr>
                <th className="u-text--muted">Base image</th>
                <td>{getImageLink(instance)}</td>
              </tr>
              <tr>
                <th className="u-text--muted">Description</th>
                <td>{instance.description ? instance.description : "-"}</td>
              </tr>
              <tr>
                <th className="u-text--muted">Type</th>
                <td>
                  {
                    instanceCreationTypes.filter(
                      (item) => item.value === instance.type,
                    )[0].label
                  }
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">IPv4</th>
                <td key={getIpAddresses(instance, "inet").length}>
                  <InstanceIps instance={instance} family="inet" />
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">IPv6</th>
                <td key={getIpAddresses(instance, "inet6").length}>
                  <InstanceIps instance={instance} family="inet6" />
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">MAC address</th>
                <td>
                  <InstanceMAC instance={instance} />
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Architecture</th>
                <td>{instance.architecture}</td>
              </tr>
              <tr>
                <th className="u-text--muted">Location</th>
                <td>
                  {settings?.environment?.server_clustered &&
                  instance.location ? (
                    <ResourceLink
                      type="cluster-member"
                      value={instance.location}
                      to="/ui/cluster"
                    />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">PID</th>
                <td>{pid}</td>
              </tr>
              <tr>
                <th className="u-text--muted">Date created</th>
                <td>{isoTimeToString(instance.created_at)}</td>
              </tr>
              <tr>
                <th className="u-text--muted">Last used</th>
                <td>{isoTimeToString(instance.last_used_at)}</td>
              </tr>
            </tbody>
          </table>
        </Col>
      </Row>
      {isVm && (
        <Row className="instance-preview">
          <Col size={3}>
            <h2 className="p-heading--5">Preview</h2>
          </Col>
          <Col size={4}>
            <InstancePreview instance={instance} onFailure={onFailure} />
          </Col>
          <Col size={3}></Col>
        </Row>
      )}
      <Row className="usage">
        <Col size={3}>
          <h2 className="p-heading--5">Usage</h2>
        </Col>
        <Col size={7}>
          <InstanceOverviewMetrics instance={instance} onFailure={onFailure} />
        </Col>
      </Row>
      <Row className="networks">
        <Col size={3}>
          <h2 className="p-heading--5">Networks</h2>
        </Col>
        <Col size={7}>
          <NetworkListTable
            devices={instance.expanded_devices as LxdDevices}
            instance={instance}
            onFailure={onFailure}
          />
        </Col>
      </Row>
      <Row className="networks">
        <Col size={3}>
          <h2 className="p-heading--5">Devices</h2>
        </Col>
        <Col size={7}>
          <DeviceListTable
            configBaseURL={`/ui/project/${encodeURIComponent(instance.project)}/instance/${encodeURIComponent(instance.name)}/configuration`}
            devices={instance.expanded_devices as LxdDevices}
          />
        </Col>
      </Row>
      <Row className="profiles">
        <Col size={3}>
          <h2 className="p-heading--5">Profiles</h2>
        </Col>
        <Col size={7}>
          <InstanceOverviewProfiles instance={instance} onFailure={onFailure} />
        </Col>
      </Row>
      <Row className="user-properties">
        <Col size={3}>
          <h2 className="p-heading--5">User properties</h2>
        </Col>
        <Col size={7}>
          <InstanceOverviewUserProperties instance={instance} />
        </Col>
      </Row>
    </div>
  );
};

export default InstanceOverview;

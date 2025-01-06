import { FC } from "react";
import { useParams } from "react-router-dom";
import { Col, Row } from "@canonical/react-components";
import useEventListener from "@use-it/event-listener";
import { updateMaxHeight } from "util/updateMaxHeight";
import ItemName from "components/ItemName";
import { LxdNetworkAcl } from "types/network";
import { filterUsedByType, LxdUsedBy } from "util/usedBy";
import ExpandableList from "components/ExpandableList";
import UsedByItem from "components/UsedByItem";

interface Props {
  acl: LxdNetworkAcl;
}

const NetworkAclDetailOverview: FC<Props> = ({ acl }) => {
  const { project } = useParams<{ project: string }>();

  if (!project) {
    return <>Missing project</>;
  }

  const updateContentHeight = () => {
    updateMaxHeight("network-overview-tab");
  };
  useEventListener("resize", updateContentHeight);

  const usageCount = acl.used_by?.length ?? 0;

  const data: Record<string, LxdUsedBy[]> = {
    instances: filterUsedByType("instance", acl.used_by),
    profiles: filterUsedByType("profile", acl.used_by),
    networks: filterUsedByType("network", acl.used_by),
  };

  return (
    <div className="network-overview-tab">
      <Row className="section">
        <Col size={3}>
          <h2 className="p-heading--5">General</h2>
        </Col>
        <Col size={7}>
          <table>
            <tbody>
              <tr>
                <th className="u-text--muted">Name</th>
                <td>
                  <ItemName item={acl} />
                </td>
              </tr>
              <tr>
                <th className="u-text--muted">Description</th>
                <td>{acl.description ? acl.description : "-"}</td>
              </tr>
            </tbody>
          </table>
        </Col>
      </Row>
      <Row className="usage list-wrapper">
        <Col size={3}>
          <h2 className="p-heading--5">Usage ({usageCount})</h2>
        </Col>
        <Col size={7}>
          <table>
            <tbody>
              <tr className="list-wrapper">
                <th className="u-text--muted">
                  Networks ({data.networks.length})
                </th>
                <td>
                  {data.networks.length > 0 ? (
                    <ExpandableList
                      items={data.networks.map((item) => (
                        <UsedByItem
                          key={item.name}
                          item={item}
                          activeProject={project}
                          type="network"
                          to={`/ui/project/${item.project}/network/${item.name}`}
                        />
                      ))}
                    />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
              <tr className="list-wrapper">
                <th className="u-text--muted">
                  Instances ({data.instances.length})
                </th>
                <td>
                  {data.instances.length > 0 ? (
                    <ExpandableList
                      items={data.instances.map((item) => (
                        <UsedByItem
                          key={item.name}
                          item={item}
                          activeProject={project}
                          type="instance"
                          to={`/ui/project/${item.project}/instance/${item.name}`}
                        />
                      ))}
                    />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
              <tr className="list-wrapper">
                <th className="u-text--muted">
                  Profiles ({data.profiles.length})
                </th>
                <td>
                  {data.profiles.length > 0 ? (
                    <ExpandableList
                      items={data.profiles.map((item) => (
                        <UsedByItem
                          key={item.name}
                          item={item}
                          activeProject={project}
                          type="profile"
                          to={`/ui/project/${item.project}/profile/${item.name}`}
                        />
                      ))}
                    />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Col>
      </Row>
    </div>
  );
};

export default NetworkAclDetailOverview;

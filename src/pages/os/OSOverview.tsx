import type { FC } from "react";
import { Col, Row, useNotify, Spinner } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import {
  fetchOSApplication,
  fetchOSApplications,
  fetchSystemUpdate,
} from "api/os";
import NotificationRow from "components/NotificationRow";
import { useIncusOS } from "context/useIncusOS";
import { nameFromURL } from "util/os";
import { queryKeys } from "util/queryKeys";

interface Props {
  target: string;
}

const OSOverview: FC<Props> = ({ target }) => {
  const notify = useNotify();
  const { data: incusOSData, error, isLoading } = useIncusOS();

  const { data: systemUpdate } = useQuery({
    queryKey: [queryKeys.osDebugLogs, target],
    queryFn: async () => fetchSystemUpdate(target),
  });

  const { data: appUrls } = useQuery({
    queryKey: [queryKeys.osApps, target],
    queryFn: async () => fetchOSApplications(target),
  });

  const apps = useQuery({
    queryKey: [queryKeys.osApps, "details", target],
    queryFn: async () => {
      return Promise.all(
        appUrls.map(async (url: string) => {
          const res = await fetchOSApplication(url, target);
          return { name: nameFromURL(url), data: res };
        }),
      );
    },
    enabled: !!appUrls,
  });

  if (isLoading) {
    return <Spinner className="u-loader" text="Loading OS overview..." />;
  }

  if (error) {
    notify.failure("Loading overview failed", error);
  }

  return (
    <div className="incusos-overview-tab">
      <NotificationRow />
      <Row className="general">
        <Col size={3}>
          <h2 className="p-heading--5">General</h2>
        </Col>
        <Col size={7}>
          <table>
            <tbody>
              <tr>
                <th className="u-text--muted">Version</th>
                <td>{incusOSData.environment.os_version}</td>
              </tr>
              <tr>
                <th className="u-text--muted">Update status</th>
                <td>{systemUpdate?.state?.status}</td>
              </tr>
              <tr>
                <th className="u-text--muted">Installed applications</th>
                <td>
                  {apps.data?.map((app) => (
                    <div key={app.name}>
                      {app.name} {app.data?.state?.version}
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </Col>
      </Row>
    </div>
  );
};

export default OSOverview;

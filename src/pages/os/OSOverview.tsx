import type { FC, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Col,
  Notification,
  Row,
  Spinner,
  useNotify,
} from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDebugLogs,
  fetchOS,
  fetchOSApplication,
  fetchOSApplications,
  fetchOSSection,
  fetchSystemUpdate,
} from "api/os";
import NotificationRow from "components/NotificationRow";
import type { IncusOSNetwork, IncusOSSecurity } from "types/os";
import type { LxdResources } from "types/resources";
import { humanFileSize } from "util/helpers";
import { nameFromURL } from "util/os";
import { queryKeys } from "util/queryKeys";
import { objectToYaml } from "util/yaml";

const formatUptime = (uptime?: number | string): string => {
  const total = Number(uptime);
  if (uptime === undefined || uptime === "" || Number.isNaN(total)) {
    return "";
  }

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);

  return [
    days > 0 ? `${days}d` : "",
    days > 0 || hours > 0 ? `${hours}h` : "",
    `${minutes}m`,
    `${seconds}s`,
  ]
    .filter(Boolean)
    .join(" ");
};

const formatProcessor = (resources?: Partial<LxdResources>): string => {
  const sockets = resources?.cpu?.sockets ?? [];
  if (sockets.length === 0) {
    return "";
  }

  const cores = sockets.reduce(
    (count, socket) => count + (socket.cores?.length ?? 0),
    0,
  );
  const numa = resources?.memory?.nodes?.length ?? 0;

  return `${sockets[0].name} (numa=${numa}, sockets=${sockets.length}, cores=${cores}, threads=${resources?.cpu?.total}) (${resources?.cpu?.architecture})`;
};

interface SectionProps {
  title: string;
  children: ReactNode;
}

const Section: FC<SectionProps> = ({ title, children }) => (
  <Row className="general">
    <Col size={3}>
      <h2 className="p-heading--5">{title}</h2>
    </Col>
    <Col size={7}>{children}</Col>
  </Row>
);

interface Props {
  target: string;
}

const OSOverview: FC<Props> = ({ target }) => {
  const notify = useNotify();
  const {
    data: incusOSData,
    error,
    isLoading,
  } = useQuery({
    queryKey: [queryKeys.os, target],
    queryFn: async () => fetchOS(target),
  });

  const { data: systemUpdate } = useQuery({
    queryKey: [queryKeys.osUpdate, target],
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
        (appUrls ?? []).map(async (url: string) => {
          const res = await fetchOSApplication(url, target);
          return { name: nameFromURL(url), data: res };
        }),
      );
    },
    enabled: !!appUrls,
  });

  const { data: securityData } = useQuery({
    queryKey: [queryKeys.osSection, "system/security", target],
    queryFn: async () => fetchOSSection("system/security", target),
  });

  const { data: networkData } = useQuery({
    queryKey: [queryKeys.osSection, "system/network", target],
    queryFn: async () => fetchOSSection("system/network", target),
  });

  const { data: resourcesData } = useQuery({
    queryKey: [queryKeys.osSection, "system/resources", target],
    queryFn: async () => fetchOSSection("system/resources", target),
  });

  // Fetch extra entries as the systemd unit messages get filtered out.
  const { data: logEntries = [] } = useQuery({
    queryKey: [queryKeys.osDebugLogs, target, "overview"],
    queryFn: async () =>
      fetchDebugLogs(target, {
        unit: "incus-osd.service",
        boot: "0",
        entries: 100,
      }),
  });

  if (isLoading) {
    return <Spinner className="u-loader" text="Loading OS overview..." />;
  }

  if (error) {
    notify.failure("Loading overview failed", error);
  }

  const environment = incusOSData?.environment;
  const security = (securityData as IncusOSSecurity | undefined)?.state;
  const interfaces =
    (networkData as IncusOSNetwork | undefined)?.state?.interfaces ?? {};
  const resources = resourcesData as Partial<LxdResources> | undefined;
  const processor = formatProcessor(resources);

  const addresses = Object.keys(interfaces)
    .sort()
    .filter((name) => (interfaces[name].addresses ?? []).length > 0);

  const logMessages = logEntries
    .filter(
      (entry) =>
        entry.SYSLOG_IDENTIFIER === "incus-osd" &&
        typeof entry.MESSAGE === "string",
    )
    .map((entry) => entry.MESSAGE as string)
    .slice(-25);

  const warnings: string[] = [];
  if (security?.tpm_status === "swtpm") {
    warnings.push(
      "Degraded security state: no physical TPM found, using swtpm",
    );
  }

  if (security?.secure_boot_enabled === false) {
    warnings.push("Degraded security state: Secure Boot is disabled");
  }

  const keysPending = security?.encryption_recovery_keys_retrieved === false;

  return (
    <div className="incusos-overview-tab">
      <NotificationRow />
      {(warnings.length > 0 || keysPending) && (
        <Notification severity="caution" title="Warnings">
          <ul className="u-no-margin--bottom">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            {keysPending && (
              <li>
                Some encryption recovery keys have not been retrieved yet, see
                the <Link to="/ui/os/system/security">security</Link> section
              </li>
            )}
          </ul>
        </Notification>
      )}
      <Section title="General">
        <table>
          <tbody>
            <tr>
              <th className="u-text--muted">Hostname</th>
              <td>{environment?.hostname}</td>
            </tr>
            <tr>
              <th className="u-text--muted">OS name</th>
              <td>{environment?.os_name}</td>
            </tr>
            <tr>
              <th className="u-text--muted">Version</th>
              <td>{environment?.os_version}</td>
            </tr>
            <tr>
              <th className="u-text--muted">Uptime</th>
              <td>{formatUptime(environment?.uptime)}</td>
            </tr>
            {processor && (
              <tr>
                <th className="u-text--muted">Processor</th>
                <td>{processor}</td>
              </tr>
            )}
            {resources?.memory && (
              <tr>
                <th className="u-text--muted">Memory</th>
                <td>{humanFileSize(resources.memory.total, 0)}</td>
              </tr>
            )}
            <tr>
              <th className="u-text--muted">Update status</th>
              <td>
                {systemUpdate?.state?.status}
                {systemUpdate?.state?.needs_reboot && " (reboot required)"}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
      {addresses.length > 0 && (
        <Section title="Network">
          <table>
            <tbody>
              {addresses.map((name) => (
                <tr key={name}>
                  <th className="u-text--muted">{name}</th>
                  <td>
                    {interfaces[name].addresses?.map((address) => (
                      <div key={address}>{address}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
      {(apps.data ?? []).length > 0 && (
        <Section title="Applications">
          <table>
            <tbody>
              {apps.data?.map((app) => (
                <tr key={app.name}>
                  <th className="u-text--muted">
                    <Link to={`/ui/os/applications/${app.name}`}>
                      {app.name}
                    </Link>
                  </th>
                  <td>
                    {app.data?.state?.friendly_version ||
                      app.data?.state?.version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
      {logMessages.length > 0 && (
        <Section title="Log">
          <pre className="incusos-overview-log">
            <code>{logMessages.join("\n")}</code>
          </pre>
        </Section>
      )}
      <Section title="System details">
        <details>
          <summary>YAML</summary>
          <pre className="yaml-code">
            <code>{objectToYaml(incusOSData ?? {})}</code>
          </pre>
        </details>
      </Section>
    </div>
  );
};

export default OSOverview;

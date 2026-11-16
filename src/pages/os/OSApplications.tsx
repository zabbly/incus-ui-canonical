import type { FC } from "react";
import {
  List,
  MainTable,
  ScrollableTable,
  Spinner,
  TablePagination,
  useNotify,
} from "@canonical/react-components";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addOSApplication,
  fetchOSApplication,
  fetchOSApplications,
  runOSAction,
  runOSActionDownload,
  runOSActionUpload,
} from "api/os";
import NotificationRow from "components/NotificationRow";
import OSActionButton from "pages/os/actions/OSActionButton";
import { nameFromURL } from "util/os";
import { queryKeys } from "util/queryKeys";
import useSortTableData from "util/useSortTableData";

interface Props {
  target: string;
}

const OSApplications: FC<Props> = ({ target }) => {
  const notify = useNotify();

  const { data: appUrls } = useQuery({
    queryKey: [queryKeys.osApps, target],
    queryFn: async () => fetchOSApplications(target),
  });

  const {
    data: apps,
    isLoading,
    error,
  } = useQuery({
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

  const appsInvalidate = [
    [queryKeys.osApps, target],
    [queryKeys.osApps, "details", target],
  ];

  const headers = [
    { content: "Name", className: "name" },
    { content: "Version", className: "version" },
    { content: "Actions", className: "actions u-align--right" },
  ];

  const rows =
    apps?.map((app) => {
      const name = app.name;
      const endpoint = `applications/${name}`;

      return {
        key: name,
        className: "u-row",
        columns: [
          {
            content: (
              <div className="u-truncate" title={name}>
                <Link to={`/ui/os/applications/${name}`}>{name}</Link>
              </div>
            ),
            role: "rowheader",
            "aria-label": "Name",
            className: "name",
          },
          {
            content:
              app.data?.state?.friendly_version || app.data?.state?.version,
            "aria-label": "Version",
            className: "version",
          },
          {
            content: (
              <List
                inline
                className="actions-list u-no-margin--bottom"
                items={[
                  <OSActionButton
                    key="check-update"
                    label="Check for updates"
                    mode="confirm"
                    icon="begin-downloading"
                    confirmMessage={`Check for updates for the ${name} application?`}
                    run={async () =>
                      runOSAction(endpoint, "check-update", target)
                    }
                    successMessage={`Update check triggered for ${name}`}
                  />,
                  <OSActionButton
                    key="switch-version"
                    label="Switch version"
                    mode="fields"
                    icon="change-version"
                    submitLabel="Switch"
                    confirmMessage={`Switch the running version of ${name}?`}
                    fields={[
                      {
                        name: "version",
                        label: "Version",
                        options: app.data?.state?.available_versions ?? [],
                        defaultValue: app.data?.state?.version,
                      },
                    ]}
                    run={async (_, values) =>
                      runOSAction(endpoint, "switch-version", target, {
                        version: String(values.version),
                      })
                    }
                    successMessage={`Version switched for ${name}`}
                    invalidateKeys={appsInvalidate}
                  />,
                  <OSActionButton
                    key="start"
                    label="Start application"
                    mode="confirm"
                    icon="play"
                    confirmMessage={`Start the ${name} application?`}
                    run={async () => runOSAction(endpoint, "start", target)}
                    successMessage={`Application ${name} started`}
                  />,
                  <OSActionButton
                    key="stop"
                    label="Stop application"
                    mode="confirm"
                    icon="stop"
                    confirmMessage={`Stop the ${name} application?`}
                    run={async () => runOSAction(endpoint, "stop", target)}
                    successMessage={`Application ${name} stopped`}
                  />,
                  <OSActionButton
                    key="restart"
                    label="Restart application"
                    mode="confirm"
                    icon="restart"
                    confirmMessage={`Restart the ${name} application?`}
                    run={async () => runOSAction(endpoint, "restart", target)}
                    successMessage={`Application ${name} restarted`}
                  />,
                  <OSActionButton
                    key="backup"
                    label="Backup application"
                    mode="download"
                    icon="export"
                    filename={`${name}-backup.tar.gz`}
                    fields={[
                      {
                        name: "complete",
                        label: "Complete backup",
                        type: "checkbox",
                        help: "Also include locally cached artifacts and updates, which may be quite large.",
                      },
                    ]}
                    run={async (_, values) =>
                      runOSActionDownload(endpoint, "backup", target, {
                        complete: Boolean(values.complete),
                      })
                    }
                    successMessage={`Application ${name} backed up`}
                  />,
                  <OSActionButton
                    key="restore"
                    label="Restore application"
                    mode="upload"
                    icon="upload"
                    submitLabel="Restore"
                    destructive
                    confirmMessage={`This will restore the ${name} application to the provided backup.`}
                    run={async (input) =>
                      runOSActionUpload(
                        endpoint,
                        "restore",
                        input as File,
                        target,
                      )
                    }
                    successMessage={`Application ${name} restored`}
                  />,
                  <OSActionButton
                    key="factory-reset"
                    label="Factory reset application"
                    mode="confirm"
                    icon="settings"
                    destructive
                    confirmMessage={`Factory-reset the ${name} application? This wipes its local configuration.`}
                    run={async () =>
                      runOSAction(endpoint, "factory-reset", target, {})
                    }
                    successMessage={`Application ${name} factory reset`}
                  />,
                  <OSActionButton
                    key="remove"
                    label="Remove application"
                    mode="confirm"
                    icon="delete"
                    destructive
                    confirmMessage={`Remove the ${name} application?`}
                    run={async () => runOSAction(endpoint, "remove", target)}
                    successMessage={`Application ${name} removed`}
                    invalidateKeys={appsInvalidate}
                  />,
                ]}
              />
            ),
            "aria-label": "Actions",
            className: "actions u-align--right",
          },
        ],
        sortData: {
          name: name.toLowerCase(),
          version: app.data?.state?.version ?? "",
        },
      };
    }) ?? [];

  const { rows: sortedRows, updateSort } = useSortTableData({ rows });

  if (error) {
    notify.failure("Loading applications failed", error);
  }

  return (
    <div>
      <NotificationRow />
      <div className="u-sv2">
        <OSActionButton
          label="Add application"
          mode="fields"
          submitLabel="Add"
          fields={[{ name: "name", label: "Name" }]}
          run={async (_, values) =>
            addOSApplication(String(values.name), target)
          }
          successMessage="Application added"
          invalidateKeys={appsInvalidate}
        />
      </div>
      {isLoading && (
        <Spinner className="u-loader" text="Loading applications..." />
      )}
      {!isLoading && !error && (
        <ScrollableTable
          dependencies={[apps, notify.notification]}
          tableId="incusos-applications-table"
          belowIds={["status-bar"]}
        >
          <TablePagination
            data={sortedRows}
            id="pagination"
            itemName="application"
            className="u-no-margin--top"
            aria-label="Table pagination control"
          >
            <MainTable
              id="incusos-applications-table"
              headers={headers}
              sortable
              emptyStateMsg="No application found"
              onUpdateSort={updateSort}
            />
          </TablePagination>
        </ScrollableTable>
      )}
    </div>
  );
};

export default OSApplications;

import type { FC } from "react";
import { useState } from "react";
import {
  MainTable,
  ScrollableTable,
  SearchBox,
  Spinner,
  TablePagination,
  useNotify,
} from "@canonical/react-components";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchOSLicenses } from "api/os";
import NotificationRow from "components/NotificationRow";
import { nameFromURL } from "util/os";
import { queryKeys } from "util/queryKeys";
import useSortTableData from "util/useSortTableData";

interface Props {
  target: string;
}

const OSLicenses: FC<Props> = ({ target }) => {
  const notify = useNotify();
  const [query, setQuery] = useState("");

  const {
    data: licenses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKeys.osLicenses, target],
    queryFn: async () => fetchOSLicenses(target),
  });

  const headers = [
    { content: "Type", sortKey: "type", className: "type" },
    { content: "Name", sortKey: "name" },
  ];

  const rows = licenses
    .map((license) => {
      // Entries are named <type>:<name>.
      const entry = decodeURIComponent(nameFromURL(license));
      const [type, ...rest] = entry.split(":");

      return { entry, type, name: rest.join(":") };
    })
    .filter(({ entry }) => entry.toLowerCase().includes(query.toLowerCase()))
    .map(({ entry, type, name }) => ({
      key: entry,
      className: "u-row",
      columns: [
        { content: type, "aria-label": "Type", className: "type" },
        {
          content: (
            <Link to={`/ui/os/licenses/${encodeURIComponent(entry)}`}>
              {name}
            </Link>
          ),
          role: "rowheader",
          "aria-label": "Name",
        },
      ],
      sortData: { type, name: name.toLowerCase() },
    }));

  const { rows: sortedRows, updateSort } = useSortTableData({ rows });

  if (error) {
    notify.failure("Loading licenses failed", error);
  }

  return (
    <div>
      <NotificationRow />
      <div className="incusos-licenses-search u-sv2">
        <SearchBox
          placeholder="Search licenses"
          value={query}
          onChange={setQuery}
          aria-label="Search licenses"
        />
      </div>
      {isLoading && <Spinner className="u-loader" text="Loading licenses..." />}
      {!isLoading && !error && (
        <ScrollableTable
          dependencies={[licenses, query, notify.notification]}
          tableId="incusos-licenses-table"
          belowIds={["status-bar"]}
        >
          <TablePagination
            data={sortedRows}
            id="pagination"
            itemName="license"
            className="u-no-margin--top"
            aria-label="Table pagination control"
          >
            <MainTable
              id="incusos-licenses-table"
              headers={headers}
              sortable
              emptyStateMsg="No license found matching this search"
              onUpdateSort={updateSort}
            />
          </TablePagination>
        </ScrollableTable>
      )}
    </div>
  );
};

export default OSLicenses;

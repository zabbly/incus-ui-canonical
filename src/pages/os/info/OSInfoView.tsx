import type { FC, ReactNode } from "react";
import { useEffect } from "react";
import { MainTable, useListener } from "@canonical/react-components";
import { updateMaxHeight } from "util/updateMaxHeight";
import { objectToYaml } from "util/yaml";

interface ViewProps {
  yamlData?: object;
  hasFooter?: boolean;
  children: ReactNode;
}

// Formatted view of a section with its raw YAML collapsed underneath.
const OSInfoView: FC<ViewProps> = ({ yamlData, hasFooter, children }) => {
  const updateHeight = () => {
    updateMaxHeight(
      "incusos-info",
      hasFooter ? "p-bottom-controls" : undefined,
      20,
    );
  };

  useEffect(updateHeight);
  useListener(window, updateHeight, "resize", true);

  return (
    <div className="incusos-info">
      {children}
      <details className="incusos-info__yaml">
        <summary>YAML</summary>
        <pre>
          <code>{objectToYaml(yamlData ?? {})}</code>
        </pre>
      </details>
    </div>
  );
};

interface SectionProps {
  title: string;
  children: ReactNode;
}

export const OSInfoSection: FC<SectionProps> = ({ title, children }) => (
  <section className="incusos-info__section">
    <h2 className="p-heading--5">{title}</h2>
    {children}
  </section>
);

export type OSInfoItem = [string, ReactNode];

const isEmpty = (value: ReactNode) =>
  value === undefined || value === null || value === "" || value === false;

interface ListProps {
  items: OSInfoItem[];
}

// Key/value list, skipping empty values.
export const OSInfoList: FC<ListProps> = ({ items }) => (
  <table className="incusos-info__list">
    <tbody>
      {items
        .filter(([, value]) => !isEmpty(value))
        .map(([label, value]) => (
          <tr key={label}>
            <th className="u-text--muted">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
    </tbody>
  </table>
);

interface TableProps {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
  paginate?: number;
}

export const OSInfoTable: FC<TableProps> = ({
  headers,
  rows,
  emptyMessage = "Nothing to show",
  paginate,
}) => (
  <MainTable
    className="incusos-info__table"
    headers={headers.map((content) => ({ content }))}
    rows={rows.map((row, i) => ({
      key: i,
      columns: row.map((content, j) => ({
        content,
        "aria-label": headers[j],
      })),
    }))}
    emptyStateMsg={emptyMessage}
    paginate={paginate}
  />
);

// One entry per line within a table cell.
export const lines = (values?: ReactNode[] | null): ReactNode =>
  (values ?? []).map((value, i) => <div key={i}>{value}</div>);

export const yesNo = (value?: boolean): string => (value ? "yes" : "");

export default OSInfoView;

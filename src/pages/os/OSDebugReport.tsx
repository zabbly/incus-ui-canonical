import type { FC } from "react";
import { useState } from "react";
import { Button, Input, Spinner, useNotify } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchDebugReport } from "api/os";
import NotificationRow from "components/NotificationRow";
import OSInfoView, { OSInfoList, OSInfoTable } from "pages/os/info/OSInfoView";
import { queryKeys } from "util/queryKeys";

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
};

interface Props {
  target: string;
}

const OSDebugReport: FC<Props> = ({ target }) => {
  const notify = useNotify();
  const [input, setInput] = useState("");
  const [match, setMatch] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKeys.osDebugReport, target, match],
    queryFn: async () => fetchDebugReport(target, match),
  });

  if (error) {
    notify.failure("Loading report failed", error);
  }

  return (
    <>
      <NotificationRow />
      <form
        className="incusos-log-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setMatch(input.split(/[\s,]+/).filter(Boolean));
        }}
      >
        <Input
          type="text"
          label="Match"
          placeholder="Metric families or prefixes"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
        />
        <Button type="submit" appearance="positive">
          Apply
        </Button>
      </form>

      {isLoading && <Spinner className="u-loader" text="Loading report..." />}
      {!isLoading && !error && data && (
        <OSInfoView yamlData={data}>
          <OSInfoList items={[["Timestamp", data.timestamp]]} />
          <OSInfoTable
            headers={["Name", "Object", "Fields", "Value"]}
            paginate={100}
            emptyMessage="No metrics found"
            rows={(data.metrics ?? []).map((metric) => [
              metric.name,
              metric.object,
              Object.keys(metric.fields ?? {})
                .sort()
                .map((key) => `${key}=${formatValue(metric.fields?.[key])}`)
                .join(", "),
              formatValue(metric.value),
            ])}
          />
        </OSInfoView>
      )}
    </>
  );
};

export default OSDebugReport;

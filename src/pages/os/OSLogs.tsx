import type { FC } from "react";
import { Spinner, useNotify } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchDebugLogs } from "api/os";
import NotificationRow from "components/NotificationRow";
import type { IncusOSLog } from "types/os";
import { queryKeys } from "util/queryKeys";

function formatTimestamp(us: string) {
  const ms = Number(us) / 1000;
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function JournalLine(item: IncusOSLog) {
  const ts = formatTimestamp(item.__REALTIME_TIMESTAMP);
  const host = item._HOSTNAME ?? "";
  const ident = item.SYSLOG_IDENTIFIER ?? item._COMM ?? "unknown";
  const pid = item._PID ? `[${item._PID}]` : "";
  const msg = item.MESSAGE ?? "";

  return (
    <>
      {ts} {host} {ident}
      {pid}: {msg}
      <br />
    </>
  );
}

interface Props {
  target: string;
}

const OSLogs: FC<Props> = ({ target }) => {
  const notify = useNotify();
  const entriesLimit = 200;

  const {
    data: logs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKeys.osDebugLogs, target],
    queryFn: async () => fetchDebugLogs(target, entriesLimit),
  });

  if (error) {
    notify.failure("Loading logs failed", error);
  }

  return (
    <>
      <NotificationRow />
      {isLoading && <Spinner className="u-loader" text="Loading logs..." />}
      {!isLoading && logs.length === 0 && (
        <div className="u-align-text--center">There are no logs.</div>
      )}
      {!isLoading && logs.length > 0 && (
        <pre>
          <code>
            {logs?.map((item, i) => <span key={i}>{JournalLine(item)}</span>)}
          </code>
        </pre>
      )}
    </>
  );
};

export default OSLogs;

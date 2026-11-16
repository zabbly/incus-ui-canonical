import type { FC } from "react";
import { useState } from "react";
import { Button, Input, Spinner, useNotify } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchDebugLogs } from "api/os";
import type { DebugLogOptions } from "api/os";
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

function decodeMessage(message: string | number[]): string {
  // systemd's journal JSON export encodes messages containing
  // non-printable or non-UTF-8 bytes as an array of byte values
  // rather than as a plain string.
  const text = Array.isArray(message)
    ? new TextDecoder().decode(new Uint8Array(message))
    : message;

  // Strip ANSI escape sequences (e.g. color codes) which would
  // otherwise show up as garbage in the browser.
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
}

function JournalLine(item: IncusOSLog) {
  const ts = formatTimestamp(item.__REALTIME_TIMESTAMP);
  const host = item._HOSTNAME ?? "";
  const ident = item.SYSLOG_IDENTIFIER ?? item._COMM ?? "unknown";
  const pid = item._PID ? `[${item._PID}]` : "";
  const msg = decodeMessage(item.MESSAGE ?? "");

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

const OSDebugLog: FC<Props> = ({ target }) => {
  const notify = useNotify();
  const [unit, setUnit] = useState("");
  const [boot, setBoot] = useState("");
  const [entries, setEntries] = useState("200");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [filters, setFilters] = useState<DebugLogOptions>({ entries: 200 });

  const {
    data: logs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKeys.osDebugLogs, target, filters],
    queryFn: async () => fetchDebugLogs(target, filters),
  });

  const applyFilters = () => {
    setFilters({
      unit: unit,
      boot: boot,
      entries: entries ? Number(entries) : undefined,
      since: since,
      until: until,
    });
  };

  if (error) {
    notify.failure("Loading logs failed", error);
  }

  return (
    <>
      <NotificationRow />
      <form
        className="incusos-log-filters"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
      >
        <Input
          type="text"
          label="Unit"
          value={unit}
          onChange={(e) => {
            setUnit(e.target.value);
          }}
        />
        <Input
          type="text"
          label="Boot"
          value={boot}
          onChange={(e) => {
            setBoot(e.target.value);
          }}
        />
        <Input
          type="number"
          label="Entries"
          value={entries}
          onChange={(e) => {
            setEntries(e.target.value);
          }}
        />
        <Input
          type="text"
          label="Since"
          placeholder="2026-01-31 12:00 or -1h"
          value={since}
          onChange={(e) => {
            setSince(e.target.value);
          }}
        />
        <Input
          type="text"
          label="Until"
          placeholder="2026-01-31 13:00 or -5m"
          value={until}
          onChange={(e) => {
            setUntil(e.target.value);
          }}
        />
        <Button type="submit" appearance="positive">
          Apply
        </Button>
      </form>

      {isLoading && <Spinner className="u-loader" text="Loading logs..." />}
      {!isLoading && logs.length === 0 && (
        <div className="u-align-text--center">There are no logs.</div>
      )}
      {!isLoading && logs.length > 0 && (
        <pre>
          <code>
            {logs?.map((item, i) => (
              <span key={i}>{JournalLine(item)}</span>
            ))}
          </code>
        </pre>
      )}
    </>
  );
};

export default OSDebugLog;

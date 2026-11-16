import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActionButton,
  Button,
  Input,
  Select,
  useNotify,
} from "@canonical/react-components";
import { fetchDebugNetworkReport, runDebugNetworkTool } from "api/os";
import NotificationRow from "components/NotificationRow";

interface ToolField {
  name: string;
  label: string;
  type?: "text" | "number" | "checkbox";
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

interface Tool {
  name: string;
  label: string;
  description: string;
  // Reports are fetched, the other tools are run.
  report?: boolean;
  fields: ToolField[];
}

const target: ToolField = { name: "target", label: "Target", required: true };
const family: ToolField = {
  name: "family",
  label: "Address family",
  options: ["", "ipv4", "ipv6"],
};
const iface: ToolField = { name: "interface", label: "Interface" };
const numeric: ToolField = {
  name: "numeric",
  label: "Don't resolve addresses to names",
  type: "checkbox",
};
const format: ToolField = {
  name: "format",
  label: "Format",
  options: ["text", "json"],
};

const tools: Tool[] = [
  {
    name: "ping",
    label: "Ping",
    description: "Ping a target from the system",
    fields: [
      target,
      {
        name: "count",
        label: "Count (0 for unlimited)",
        type: "number",
        defaultValue: "10",
      },
      family,
      iface,
      { name: "interval", label: "Interval (seconds)", type: "number" },
      {
        name: "pmtu_discovery",
        label: "Path MTU discovery",
        options: ["", "do", "dont", "want", "probe"],
      },
      { name: "size", label: "Payload size (bytes)", type: "number" },
      numeric,
    ],
  },
  {
    name: "trace",
    label: "Trace",
    description: "Trace the network path to a target",
    fields: [
      target,
      {
        name: "count",
        label: "Probes per hop (0 for unlimited)",
        type: "number",
        defaultValue: "10",
      },
      family,
      iface,
      format,
      numeric,
    ],
  },
  {
    name: "speed-test",
    label: "Speed test",
    description: "Measure the bandwidth to an iperf3 server",
    fields: [
      target,
      { name: "port", label: "Server port", type: "number" },
      {
        name: "duration",
        label: "Duration (seconds, 0 for unlimited)",
        type: "number",
        defaultValue: "10",
      },
      { name: "protocol", label: "Protocol", options: ["", "tcp", "udp"] },
      { name: "bitrate", label: "Target bitrate", placeholder: "100M" },
      { name: "parallel", label: "Parallel connections", type: "number" },
      family,
      iface,
      format,
      {
        name: "reverse",
        label: "Measure the download rather than upload bandwidth",
        type: "checkbox",
      },
    ],
  },
  {
    name: "dump-traffic",
    label: "Dump traffic",
    description: "Get a network traffic dump",
    fields: [
      iface,
      { name: "filter", label: "Capture filter", placeholder: "port 443" },
      {
        name: "duration",
        label: "Duration (seconds, 0 for unlimited)",
        type: "number",
        defaultValue: "10",
      },
      { name: "format", label: "Format", options: ["text", "pcap"] },
    ],
  },
  {
    name: "conntrack",
    label: "Connection tracking",
    description: "Get the connection tracking table",
    report: true,
    fields: [],
  },
  {
    name: "firewall",
    label: "Firewall",
    description: "Get the firewall ruleset",
    report: true,
    fields: [format],
  },
  {
    name: "routes",
    label: "Routes",
    description: "Get the routing rules and tables",
    report: true,
    fields: [format],
  },
  {
    name: "sockets",
    label: "Sockets",
    description: "Get the system sockets",
    report: true,
    fields: [],
  },
];

type Values = Record<string, string | boolean>;

const initialValues = (tool: Tool): Values => {
  const values: Values = {};

  tool.fields.forEach((field) => {
    values[field.name] =
      field.type === "checkbox"
        ? false
        : (field.defaultValue ?? field.options?.[0] ?? "");
  });

  return values;
};

// Leave out anything unset so the server defaults apply.
const requestData = (tool: Tool, values: Values) => {
  const data: Record<string, string | number | boolean> = {};

  tool.fields.forEach((field) => {
    const value = values[field.name];

    if (value === "" || value === false) {
      return;
    }

    data[field.name] = field.type === "number" ? Number(value) : value;
  });

  return data;
};

const showResult = (result: unknown): string =>
  typeof result === "string" ? result : JSON.stringify(result, null, 2);

// Cap the output of unlimited runs.
const maxOutput = 1024 * 1024;

interface Props {
  target: string;
}

const OSDebugNetwork: FC<Props> = ({ target: member }) => {
  const notify = useNotify();
  const [tool, setTool] = useState<Tool>(tools[0]);
  const [values, setValues] = useState<Values>(initialValues(tools[0]));
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);

  // Stop anything still running when leaving the page.
  useEffect(() => () => controller.current?.abort(), []);

  const selectTool = (name: string) => {
    const selected = tools.find((item) => item.name === name) ?? tools[0];

    controller.current?.abort();
    setTool(selected);
    setValues(initialValues(selected));
    setOutput(undefined);
  };

  const run = async () => {
    notify.clear();
    setOutput("");
    setRunning(true);

    const abort = new AbortController();
    controller.current = abort;

    try {
      if (tool.report) {
        const report = await fetchDebugNetworkReport(
          tool.name,
          member,
          String(values.format ?? ""),
        );

        setOutput(showResult(report));

        return;
      }

      const pcap = tool.name === "dump-traffic" && values.format === "pcap";
      const chunks: BlobPart[] = [];
      const decoder = new TextDecoder();

      const result = await runDebugNetworkTool(
        tool.name,
        requestData(tool, values),
        member,
        values.format !== "json",
        (chunk) => {
          if (pcap) {
            chunks.push(chunk.slice());

            return;
          }

          const text = decoder.decode(chunk, { stream: true });
          setOutput((current) => ((current ?? "") + text).slice(-maxOutput));
        },
        abort.signal,
      );

      if (result !== undefined) {
        setOutput(showResult(result));
      }

      if (pcap) {
        const url = URL.createObjectURL(new Blob(chunks));
        const a = document.createElement("a");
        a.href = url;
        a.download = "traffic.pcap";
        a.click();
        URL.revokeObjectURL(url);
        setOutput("Capture downloaded.");
      }
    } catch (e) {
      if (!abort.signal.aborted) {
        notify.failure(`${tool.label} failed`, e);
      }
    } finally {
      if (controller.current === abort) {
        setRunning(false);
      }
    }
  };

  const missing = tool.fields.some(
    (field) => field.required && !values[field.name],
  );

  return (
    <>
      <NotificationRow />
      <form
        className="incusos-debug-network"
        onSubmit={(e) => {
          e.preventDefault();
          if (!running && !missing) {
            void run();
          }
        }}
      >
        <Select
          label="Tool"
          value={tool.name}
          help={tool.description}
          options={tools.map((item) => ({
            label: item.label,
            value: item.name,
          }))}
          onChange={(e) => {
            selectTool(e.target.value);
          }}
        />
        <div className="incusos-debug-network__fields">
          {tool.fields.map((field) => {
            const key = `${tool.name}-${field.name}`;

            if (field.type === "checkbox") {
              return (
                <Input
                  key={key}
                  type="checkbox"
                  label={field.label}
                  checked={Boolean(values[field.name])}
                  onChange={(e) => {
                    setValues({ ...values, [field.name]: e.target.checked });
                  }}
                />
              );
            }

            if (field.options) {
              return (
                <Select
                  key={key}
                  label={field.label}
                  value={String(values[field.name])}
                  options={field.options.map((option) => ({
                    label: option || "Default",
                    value: option,
                  }))}
                  onChange={(e) => {
                    setValues({ ...values, [field.name]: e.target.value });
                  }}
                />
              );
            }

            return (
              <Input
                key={key}
                type={field.type ?? "text"}
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                min={field.type === "number" ? 0 : undefined}
                step={field.name === "interval" ? "any" : undefined}
                value={String(values[field.name])}
                onChange={(e) => {
                  setValues({ ...values, [field.name]: e.target.value });
                }}
              />
            );
          })}
        </div>
        <ActionButton
          type="submit"
          appearance="positive"
          loading={running}
          disabled={missing}
        >
          {tool.report ? "Show" : "Run"}
        </ActionButton>
        {running && !tool.report && (
          <Button
            type="button"
            onClick={() => {
              controller.current?.abort();
              setRunning(false);
            }}
          >
            Stop
          </Button>
        )}
      </form>
      {output !== undefined && (
        <pre className="incusos-debug-network__output">
          <code>{output}</code>
        </pre>
      )}
    </>
  );
};

export default OSDebugNetwork;

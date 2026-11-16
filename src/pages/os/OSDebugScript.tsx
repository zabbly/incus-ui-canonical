import type { FC } from "react";
import { useState } from "react";
import { ActionButton, useNotify } from "@canonical/react-components";
import { runDebugScript } from "api/os";
import NotificationRow from "components/NotificationRow";

interface Props {
  target: string;
}

const OSDebugScript: FC<Props> = ({ target }) => {
  const notify = useNotify();
  const [file, setFile] = useState<File | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | undefined>(undefined);

  const run = () => {
    if (!file) {
      return;
    }

    notify.clear();
    setRunning(true);
    setOutput(undefined);

    runDebugScript(file, target)
      .then(setOutput)
      .catch((e) => {
        notify.failure("Running the script failed", e);
      })
      .finally(() => {
        setRunning(false);
      });
  };

  return (
    <>
      <NotificationRow />
      <p>Run a signed debug script on the system and show its output.</p>
      <div className="incusos-log-filters u-sv2">
        <input
          type="file"
          aria-label="Script"
          onChange={(e) => {
            setFile(e.target.files?.[0]);
          }}
        />
        <ActionButton
          appearance="positive"
          loading={running}
          disabled={!file}
          onClick={run}
        >
          Run script
        </ActionButton>
      </div>
      {output !== undefined && (
        <pre>
          <code>{output || "The script produced no output."}</code>
        </pre>
      )}
    </>
  );
};

export default OSDebugScript;

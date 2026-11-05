import { useState, type FC } from "react";
import {
  ActionButton,
  Button,
  Notification,
  Spinner,
  Textarea,
  useToastNotification,
} from "@canonical/react-components";
import type { LxdInstance } from "types/instance";
import type { InstanceMigrationBundle } from "types/migration";
import { startInstanceMigration } from "api/instances";
import { useSettings } from "context/useSettings";
import { useEventQueue } from "context/eventQueue";
import { InstanceRichChip } from "pages/instances/InstanceRichChip";
import DsIcon from "components/DsIcon";
import { useRemoteMigrationStorage } from "./RemoteMigrationStorage";

interface Props {
  instance: LxdInstance;
  onCancel: () => void;
}

// Source side of a cross-cluster migration. Starts a migration operation on the
// local server and packages everything a remote cluster needs to pull the
// instance in into a single copyable bundle string.
const InstanceRemoteClusterMigration: FC<Props> = ({ instance, onCancel }) => {
  const { data: settings } = useSettings();
  const eventQueue = useEventQueue();
  const toastNotify = useToastNotification();
  const [bundle, setBundle] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [copied, setCopied] = useState(false);
  const storage = useRemoteMigrationStorage(instance);

  const chip = (
    <InstanceRichChip
      instanceName={instance.name}
      projectName={instance.project}
    />
  );

  const handleCopy = () => {
    navigator.clipboard
      .writeText(bundle)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((e: unknown) => {
        console.error(e);
      });
  };

  const addresses = settings?.environment?.addresses ?? [];
  const certificate = settings?.environment?.certificate ?? "";
  const canGenerate = addresses.length > 0 && certificate !== "";

  const generate = () => {
    setLoading(true);
    setError("");
    setSucceeded(false);
    startInstanceMigration(instance)
      .then((operation) => {
        // The source operation stays open until a remote cluster connects and
        // pulls. Track it so the user is notified whether it succeeds or fails
        // (e.g. the target never connected and it timed out).
        eventQueue.set(
          operation.metadata.id,
          () => {
            setSucceeded(true);
            setError("");
            toastNotify.success(<>Migration of instance {chip} completed.</>);
          },
          (msg) => {
            setBundle("");
            setError(msg);
            toastNotify.failure(
              `Migration failed for instance ${instance.name}`,
              new Error(msg),
              chip,
            );
          },
        );

        const payload: InstanceMigrationBundle = {
          instanceName: instance.name,
          instanceType: instance.type,
          architecture: instance.architecture,
          config: instance.config,
          devices: storage.devices,
          profiles: instance.profiles,
          ephemeral: instance.ephemeral,
          description: instance.description,
          addresses,
          certificate,
          operation: `/1.0/operations/${operation.metadata.id}`,
          secrets: operation.metadata.metadata ?? {},
          live:
            instance.type === "virtual-machine" &&
            instance.status === "Running",
        };
        setBundle(btoa(JSON.stringify(payload)));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <div className="migrate-instance-remote">
        <p>
          Migrate instance <strong>{instance.name}</strong> to a remote cluster.
          Copy the migration code below and paste it into the target
          cluster&rsquo;s &ldquo;Receive migration&rdquo; dialog to pull the
          instance in.
        </p>
        {!canGenerate && (
          <Notification severity="caution" title="Not available">
            This server does not expose a network address and certificate, so it
            cannot be reached by a remote cluster for migration.
          </Notification>
        )}
        {error && (
          <Notification severity="negative" title="Migration failed">
            {error}
          </Notification>
        )}
        {succeeded && (
          <Notification severity="positive" title="Migration completed">
            Instance <strong>{instance.name}</strong> was migrated to the remote
            cluster.
          </Notification>
        )}
        {canGenerate && !bundle && !succeeded && storage.fields}
        {isLoading && <Spinner text="Preparing migration…" />}
        {bundle && !succeeded && (
          <>
            <Textarea
              id="migration-code"
              label="Migration code"
              value={bundle}
              rows={8}
              readOnly
              className="migration-code"
              onFocus={(e) => {
                e.target.select();
              }}
            />
            <Button type="button" hasIcon onClick={handleCopy}>
              <DsIcon icon={copied ? "checkmark" : "copy"} />
              <span>{copied ? "Copied" : "Copy migration code"}</span>
            </Button>
            <p className="u-text--muted">
              This code contains one-time secrets. The remote cluster has to
              start receiving within 30 seconds, otherwise the migration fails
              and a new code is needed.
            </p>
          </>
        )}
      </div>
      <footer id="migrate-instance-actions" className="p-modal__footer">
        <Button
          className="u-no-margin--bottom"
          type="button"
          appearance="base"
          onClick={onCancel}
        >
          {bundle ? "Close" : "Cancel"}
        </Button>
        {!bundle && (
          <ActionButton
            appearance="positive"
            className="u-no-margin--bottom"
            onClick={generate}
            loading={isLoading}
            disabled={!canGenerate || isLoading || storage.hasErrors}
          >
            Generate migration code
          </ActionButton>
        )}
      </footer>
    </>
  );
};

export default InstanceRemoteClusterMigration;

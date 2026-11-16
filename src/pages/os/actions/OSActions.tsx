import type { FC } from "react";
import classnames from "classnames";
import { List } from "@canonical/react-components";
import { runOSAction, runOSActionDownload, runOSActionUpload } from "api/os";
import OSActionButton from "pages/os/actions/OSActionButton";
import type {
  OSActionField,
  OSActionValues,
} from "pages/os/actions/OSActionButton";
import { yamlToObject } from "util/yaml";

const nextBootField: OSActionField = {
  name: "next_boot_version",
  label: "Next boot version",
  options: [
    { label: "Newest installed version", value: "newest" },
    { label: "Current version", value: "current" },
    { label: "Previous version", value: "oldest" },
  ],
  defaultValue: "newest",
};

// Only send a body when deviating from the default.
const nextBootData = (values: OSActionValues) => {
  const version = String(values.next_boot_version ?? "newest");

  return version === "newest" ? undefined : { next_boot_version: version };
};

const restoreSkipOptions = [
  {
    name: "encryption-recovery-keys",
    label: "Skip encryption recovery keys",
  },
  {
    name: "local-data-encryption-key",
    label: "Skip local data pool encryption key",
  },
  { name: "network-macs", label: "Skip network MAC addresses" },
];

interface Props {
  className?: string;
  target: string;
}

const OSActions: FC<Props> = ({ className, target }) => {
  const items = [
    <OSActionButton
      key="reboot"
      label="Reboot"
      mode="fields"
      icon="restart"
      confirmMessage="This will reboot the system."
      fields={[nextBootField]}
      run={async (_, values) =>
        runOSAction("system", "reboot", target, nextBootData(values))
      }
      successMessage="Reboot triggered"
    />,
    <OSActionButton
      key="suspend"
      label="Suspend"
      mode="confirm"
      icon="pause"
      confirmMessage="Are you sure you want to suspend the system?"
      run={async () => runOSAction("system", "suspend", target)}
      successMessage="System suspended"
    />,
    <OSActionButton
      key="poweroff"
      label="Power off"
      mode="fields"
      icon="stop"
      confirmMessage="This will power off the system."
      fields={[nextBootField]}
      run={async (_, values) =>
        runOSAction("system", "poweroff", target, nextBootData(values))
      }
      successMessage="Power off triggered"
    />,
    <OSActionButton
      key="backup"
      label="Backup"
      mode="download"
      icon="begin-downloading"
      filename="incus-os-backup.tar.gz"
      run={async () => runOSActionDownload("system", "backup", target, {})}
      successMessage="System backup downloaded"
    />,
    <OSActionButton
      key="restore"
      label="Restore"
      mode="upload"
      icon="upload"
      submitLabel="Restore"
      destructive
      confirmMessage="This will restore the system state to the provided backup. Select anything that should be kept as is rather than restored."
      fields={restoreSkipOptions.map((option) => ({
        name: option.name,
        label: option.label,
        type: "checkbox",
      }))}
      run={async (input, values) =>
        runOSActionUpload("system", "restore", input as File, target, {
          skip: restoreSkipOptions
            .filter((option) => values[option.name])
            .map((option) => option.name)
            .join(","),
        })
      }
      successMessage="System restore triggered"
    />,
    <OSActionButton
      key="factory-reset"
      label="Factory reset"
      mode="fields"
      icon="settings"
      destructive
      confirmMessage="This will factory-reset the system."
      fields={[
        {
          name: "allow_tpm_reset_failure",
          label: "Allow TPM reset failure",
          type: "checkbox",
        },
        {
          name: "wipe_existing_seeds",
          label: "Wipe existing seeds",
          type: "checkbox",
        },
        {
          name: "seeds",
          label: "Seeds (YAML)",
          type: "textarea",
          help: "Optional map of seed name to seed content to apply on reset.",
        },
      ]}
      run={async (_, values) => {
        const seeds = String(values.seeds ?? "").trim();

        return runOSAction("system", "factory-reset", target, {
          allow_tpm_reset_failure: Boolean(values.allow_tpm_reset_failure),
          wipe_existing_seeds: Boolean(values.wipe_existing_seeds),
          ...(seeds ? { seeds: yamlToObject(seeds) } : {}),
        });
      }}
      successMessage="Factory reset triggered"
    />,
  ];

  return (
    <List
      inline
      className={classnames(className, "actions-list")}
      items={items}
    />
  );
};

export default OSActions;

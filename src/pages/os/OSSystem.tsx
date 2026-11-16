import type { FC, ReactNode } from "react";
import { Notification } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchOSSection, runOSAction } from "api/os";
import TabLinks from "components/TabLinks";
import OSConfigSection from "pages/os/OSConfigSection";
import OSActionButton from "pages/os/actions/OSActionButton";
import type { OSActionValues } from "pages/os/actions/OSActionButton";
import OSKernelInfo from "pages/os/info/OSKernelInfo";
import OSNetworkInfo from "pages/os/info/OSNetworkInfo";
import OSResourcesInfo from "pages/os/info/OSResourcesInfo";
import OSStorageInfo from "pages/os/info/OSStorageInfo";
import type {
  IncusOSConfig,
  IncusOSNetwork,
  IncusOSSecurity,
  IncusOSStorage,
} from "types/os";
import { queryKeys } from "util/queryKeys";
import { slugify } from "util/slugify";

const str = (v: OSActionValues, k: string) => String(v[k] ?? "");
const num = (v: OSActionValues, k: string) => Number(v[k] ?? 0);
const bool = (v: OSActionValues, k: string) => Boolean(v[k]);

interface ActionsProps {
  target: string;
}

const NetworkActions: FC<ActionsProps> = ({ target }) => {
  const invalidate = [[queryKeys.osSection, "system/network", target]];
  const { data } = useQuery({
    queryKey: [queryKeys.osSection, "system/network", target],
    queryFn: async () => fetchOSSection("system/network", target),
  });

  const state = (data as IncusOSNetwork | undefined)?.state;
  const pendingChange = state?.configuration_in_process ?? false;

  return (
    <>
      {pendingChange && (
        <OSActionButton
          label="Confirm configuration"
          mode="confirm"
          confirmMessage="Confirm the new network configuration?"
          run={async () => runOSAction("system/network", "confirm", target)}
          successMessage="Network configuration confirmed"
          invalidateKeys={invalidate}
        />
      )}
      <OSActionButton
        label="Flush DNS cache"
        mode="confirm"
        confirmMessage="Flush the DNS cache?"
        run={async () => runOSAction("system/network", "flush-dns", target)}
        successMessage="DNS cache flushed"
      />
      <OSActionButton
        label="Set link state"
        mode="fields"
        submitLabel="Apply"
        fields={[
          {
            name: "name",
            label: "Name",
            help: "Interface name, or MAC address or device name of an interface or bond member.",
          },
          { name: "state", label: "State", options: ["up", "down"] },
        ]}
        run={async (_, values) =>
          runOSAction("system/network", "link-state", target, {
            name: str(values, "name"),
            state: str(values, "state"),
          })
        }
        successMessage="Link state updated"
        invalidateKeys={invalidate}
      />
    </>
  );
};

const StorageActions: FC<ActionsProps> = ({ target }) => {
  const invalidate = [[queryKeys.osSection, "system/storage", target]];
  const { data } = useQuery({
    queryKey: [queryKeys.osSection, "system/storage", target],
    queryFn: async () => fetchOSSection("system/storage", target),
  });

  const storage = data as IncusOSStorage | undefined;
  const pools = (storage?.config?.pools ?? []).map((pool) => pool.name);
  const drives = (storage?.state?.drives ?? []).map((drive) => drive.id);

  return (
    <>
      <OSActionButton
        label="Create volume"
        mode="fields"
        submitLabel="Create"
        fields={[
          { name: "pool", label: "Pool", options: pools },
          { name: "name", label: "Name" },
          { name: "quota", label: "Quota (bytes)", type: "number" },
          { name: "use", label: "Use" },
        ]}
        run={async (_, values) =>
          runOSAction("system/storage", "create-volume", target, {
            pool: str(values, "pool"),
            name: str(values, "name"),
            quota: num(values, "quota"),
            use: str(values, "use"),
          })
        }
        successMessage="Volume created"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Delete volume"
        mode="fields"
        submitLabel="Delete"
        destructive
        confirmMessage="This will delete the storage volume."
        fields={[
          { name: "pool", label: "Pool", options: pools },
          { name: "name", label: "Name" },
          { name: "force", label: "Force", type: "checkbox" },
        ]}
        run={async (_, values) =>
          runOSAction("system/storage", "delete-volume", target, {
            pool: str(values, "pool"),
            name: str(values, "name"),
            force: bool(values, "force"),
          })
        }
        successMessage="Volume deleted"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Delete pool"
        mode="fields"
        submitLabel="Delete"
        destructive
        confirmMessage="This will delete the storage pool."
        fields={[
          { name: "name", label: "Name", options: pools, required: true },
        ]}
        run={async (_, values) =>
          runOSAction("system/storage", "delete-pool", target, {
            name: str(values, "name"),
          })
        }
        successMessage="Pool deleted"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Scrub pool"
        mode="fields"
        submitLabel="Scrub"
        fields={[{ name: "name", label: "Name", options: pools }]}
        run={async (_, values) =>
          runOSAction("system/storage", "scrub-pool", target, {
            name: str(values, "name"),
          })
        }
        successMessage="Pool scrub triggered"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Trim pool"
        mode="fields"
        submitLabel="Trim"
        fields={[{ name: "name", label: "Name", options: pools }]}
        run={async (_, values) =>
          runOSAction("system/storage", "trim-pool", target, {
            name: str(values, "name"),
          })
        }
        successMessage="Pool trim triggered"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Encrypt drive"
        mode="fields"
        submitLabel="Encrypt"
        destructive
        confirmMessage="This will wipe and encrypt the drive."
        fields={[
          { name: "id", label: "Drive ID", options: drives, required: true },
          { name: "secure_wipe", label: "Secure wipe", type: "checkbox" },
        ]}
        run={async (_, values) =>
          runOSAction("system/storage", "encrypt-drive", target, {
            id: str(values, "id"),
            secure_wipe: bool(values, "secure_wipe"),
          })
        }
        successMessage="Drive encryption triggered"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Wipe drive"
        mode="fields"
        submitLabel="Wipe"
        destructive
        confirmMessage="This will wipe the drive."
        fields={[
          { name: "id", label: "Drive ID", options: drives, required: true },
          { name: "secure_wipe", label: "Secure wipe", type: "checkbox" },
        ]}
        run={async (_, values) =>
          runOSAction("system/storage", "wipe-drive", target, {
            id: str(values, "id"),
            secure_wipe: bool(values, "secure_wipe"),
          })
        }
        successMessage="Drive wipe triggered"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Import encrypted drive"
        mode="fields"
        submitLabel="Import"
        fields={[
          { name: "id", label: "Drive ID", options: drives },
          { name: "key", label: "Encryption key" },
        ]}
        run={async (_, values) =>
          runOSAction("system/storage", "import-encrypted-drive", target, {
            id: str(values, "id"),
            key: str(values, "key"),
          })
        }
        successMessage="Drive imported"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Import pool"
        mode="fields"
        submitLabel="Import"
        fields={[
          { name: "name", label: "Name" },
          { name: "encryption_key", label: "Encryption key" },
          { name: "force", label: "Force", type: "checkbox" },
        ]}
        run={async (_, values) =>
          runOSAction("system/storage", "import-pool", target, {
            name: str(values, "name"),
            type: "zfs",
            encryption_key: str(values, "encryption_key"),
            force: bool(values, "force"),
          })
        }
        successMessage="Pool imported"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Rescan SCSI"
        mode="confirm"
        confirmMessage="Rescan the SCSI buses for new devices?"
        run={async () => runOSAction("system/storage", "rescan-scsi", target)}
        successMessage="SCSI rescan triggered"
        invalidateKeys={invalidate}
      />
      <OSActionButton
        label="Clean up root"
        mode="confirm"
        confirmMessage="Clean up the root partition?"
        run={async () => runOSAction("system/storage", "cleanup-root", target)}
        successMessage="Root partition cleaned up"
        invalidateKeys={invalidate}
      />
    </>
  );
};

const SecurityActions: FC<ActionsProps> = ({ target }) => {
  const invalidate = [[queryKeys.osSection, "system/security", target]];
  const { data } = useQuery({
    queryKey: [queryKeys.osSection, "system/security", target],
    queryFn: async () => fetchOSSection("system/security", target),
  });

  const state = (data as IncusOSSecurity | undefined)?.state;
  const keysPending = state?.encryption_recovery_keys_retrieved === false;

  return (
    <>
      {keysPending && (
        <Notification severity="caution" title="Recovery keys not retrieved">
          Once the encryption recovery keys have been securely recorded, mark
          them as retrieved.
        </Notification>
      )}
      {keysPending && (
        <OSActionButton
          label="Mark recovery keys as retrieved"
          mode="confirm"
          submitLabel="Mark as retrieved"
          confirmMessage="Mark the encryption recovery keys as retrieved?"
          run={async () => runOSAction("system/security", "retrieved", target)}
          successMessage="Recovery keys marked as retrieved"
          invalidateKeys={invalidate}
        />
      )}
      <OSActionButton
        label="Rebind TPM"
        mode="confirm"
        confirmMessage="Rebind the TPM and reboot the system?"
        run={async () => runOSAction("system/security", "tpm-rebind", target)}
        successMessage="TPM rebind triggered"
      />
    </>
  );
};

const UpdateActions: FC<ActionsProps> = ({ target }) => (
  <OSActionButton
    label="Check for updates"
    mode="fields"
    submitLabel="Check"
    confirmMessage="Check for updates and apply any pending update?"
    fields={[{ name: "os_only", label: "Only check the OS", type: "checkbox" }]}
    run={async (_, values) =>
      runOSAction("system/update", "check", target, {
        os_only: bool(values, "os_only"),
      })
    }
    successMessage="Update check triggered"
    invalidateKeys={[[queryKeys.osSection, "system/update", target]]}
  />
);

interface Section {
  label: string;
  endpoint: string;
  readOnly?: boolean;
  actions?: (target: string) => ReactNode;
  info?: (data: IncusOSConfig) => ReactNode;
}

const allSections: Section[] = [
  {
    label: "Network",
    endpoint: "system/network",
    actions: (target) => <NetworkActions target={target} />,
    info: (data) => <OSNetworkInfo data={data as IncusOSNetwork} />,
  },
  {
    label: "Storage",
    endpoint: "system/storage",
    actions: (target) => <StorageActions target={target} />,
    info: (data) => <OSStorageInfo data={data as IncusOSStorage} />,
  },
  {
    label: "Security",
    endpoint: "system/security",
    actions: (target) => <SecurityActions target={target} />,
  },
  {
    label: "Update",
    endpoint: "system/update",
    actions: (target) => <UpdateActions target={target} />,
  },
  {
    label: "Kernel",
    endpoint: "system/kernel",
    info: (data) => <OSKernelInfo data={data} />,
  },
  { label: "Power", endpoint: "system/power" },
  { label: "Logging", endpoint: "system/logging" },
  { label: "Provider", endpoint: "system/provider" },
  { label: "Fallback listener", endpoint: "system/fallback-listener" },
  {
    label: "Resources",
    endpoint: "system/resources",
    readOnly: true,
    info: (data) => <OSResourcesInfo data={data} />,
  },
];

const sections = allSections.sort((a, b) => a.label.localeCompare(b.label));

interface Props {
  subTab?: string;
  target: string;
}

const OSSystem: FC<Props> = ({ subTab, target }) => {
  const tabs = sections.map((section) => section.label);
  const active =
    sections.find((section) => slugify(section.label) === subTab) ??
    sections[0];

  return (
    <>
      <TabLinks tabs={tabs} activeTab={subTab} tabUrl={`/ui/os/system`} />
      <OSConfigSection
        key={active.endpoint}
        endpoint={active.endpoint}
        label={active.label}
        target={target}
        readOnly={active.readOnly}
        actions={active.actions ? active.actions(target) : undefined}
        info={active.info}
      />
    </>
  );
};

export default OSSystem;

import { useEffect, useState, type ReactNode } from "react";
import { Notification } from "@canonical/react-components";
import StoragePoolSelector from "pages/storage/StoragePoolSelector";
import DependentDiskCopyFields from "pages/instances/forms/DependentDiskCopyFields";
import { useStoragePools } from "context/useStoragePools";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import type { LxdDevices, LxdDiskDevice } from "types/device";
import type { InstanceMigrationBundle } from "types/migration";
import {
  getDependentDisksFromDevices,
  getVolumeName,
  replaceVolumeName,
} from "util/dependentDisks";

interface ReceiveMigrationStorage {
  fields: ReactNode;
  devices: LxdDevices;
  hasErrors: boolean;
}

const getLocalRootDisk = (
  devices: LxdDevices,
): [string, LxdDiskDevice] | undefined => {
  const entry = Object.entries(devices).find(([, device]) => {
    const disk = device as LxdDiskDevice;
    return disk.type === "disk" && disk.path === "/" && !disk.source;
  });
  return entry ? [entry[0], entry[1] as LxdDiskDevice] : undefined;
};

// Storage pools on the target cluster for the root disk and dependent volumes of
// an instance received from a remote cluster. Pools keep their source name when
// the target has a pool with that name, and fall back to the chosen root pool.
export const useReceiveMigrationStorage = (
  bundle: InstanceMigrationBundle | null,
  project: string,
): ReceiveMigrationStorage => {
  const { hasDependentDisks } = useSupportedFeatures();
  const { data: pools = [] } = useStoragePools(!!bundle, project);
  const poolNames = pools.map((pool) => pool.name);
  const findPool = (name?: string) =>
    name && poolNames.includes(name) ? name : undefined;

  const [rootPoolOverride, setRootPoolOverride] = useState("");
  const [diskPoolOverrides, setDiskPoolOverrides] = useState<
    Record<string, string>
  >({});
  const [diskNameOverrides, setDiskNameOverrides] = useState<
    Record<string, string>
  >({});

  // A new code is a different instance, start over.
  const bundleKey = bundle ? `${bundle.operation}/${bundle.instanceName}` : "";
  useEffect(() => {
    setRootPoolOverride("");
    setDiskPoolOverrides({});
    setDiskNameOverrides({});
  }, [bundleKey]);

  const sourceDevices = bundle?.devices ?? {};
  const rootDisk = getLocalRootDisk(sourceDevices);
  const dependentDisks = hasDependentDisks
    ? getDependentDisksFromDevices(sourceDevices)
    : [];

  const rootPool =
    rootPoolOverride || findPool(rootDisk?.[1].pool) || poolNames[0] || "";

  const diskPools = Object.fromEntries(
    dependentDisks.map((disk) => [
      disk.name,
      diskPoolOverrides[disk.name] ?? findPool(disk.device.pool) ?? rootPool,
    ]),
  );
  const diskNames = Object.fromEntries(
    dependentDisks.map((disk) => [
      disk.name,
      diskNameOverrides[disk.name] ?? getVolumeName(disk.device.source),
    ]),
  );

  // Pools named in the code that this cluster doesn't have, their selects fall back.
  const missingPools =
    poolNames.length > 0
      ? [
          ...new Set(
            [
              rootDisk?.[1].pool,
              ...dependentDisks.map((disk) => disk.device.pool),
            ].filter((pool): pool is string => !!pool && !findPool(pool)),
          ),
        ]
      : [];

  const errors: Record<string, string | undefined> = {};
  dependentDisks.forEach((disk) => {
    const name = diskNames[disk.name].trim();
    if (!name) {
      errors[disk.name] = "Volume name is required";
    } else if (name.includes("/")) {
      errors[disk.name] = "Volume name can't contain a slash";
    }
  });

  const devices: LxdDevices = { ...sourceDevices };
  if (rootPool) {
    // Without a local root disk the profiles would pick the pool, add one like
    // "incus copy --storage" does.
    const [rootName, rootDevice] = rootDisk ?? [
      "root",
      { type: "disk", path: "/" } as LxdDiskDevice,
    ];
    devices[rootName] = { ...rootDevice, pool: rootPool };
  }
  dependentDisks.forEach((disk) => {
    devices[disk.name] = {
      ...disk.device,
      pool: diskPools[disk.name],
      source: replaceVolumeName(
        disk.device.source ?? "",
        diskNames[disk.name].trim(),
      ),
    };
  });

  const fields = bundle ? (
    <>
      {missingPools.length > 0 && (
        <Notification severity="caution" title="Storage pools not found">
          This cluster has no pool named {missingPools.join(", ")}. Check the
          selected pools below.
        </Notification>
      )}
      <StoragePoolSelector
        value={rootPool}
        setValue={setRootPoolOverride}
        project={project}
        selectProps={{
          id: "receive-root-pool",
          label: (
            <>
              Root storage pool
              {rootDisk?.[1].pool && (
                <>
                  {" "}
                  (source pool <b>{rootDisk[1].pool}</b>)
                </>
              )}
            </>
          ),
        }}
      />
      <DependentDiskCopyFields
        disks={dependentDisks}
        pools={diskPools}
        names={diskNames}
        errors={errors}
        setPool={(disk, pool) => {
          setDiskPoolOverrides((prev) => ({ ...prev, [disk]: pool }));
        }}
        setName={(disk, name) => {
          setDiskNameOverrides((prev) => ({ ...prev, [disk]: name }));
        }}
      />
    </>
  ) : null;

  return {
    fields,
    devices,
    hasErrors: Object.keys(errors).length > 0,
  };
};

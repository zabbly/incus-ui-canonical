import { useState, type ReactNode } from "react";
import { Input } from "@canonical/react-components";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import type { LxdDevices, LxdDiskDevice } from "types/device";
import type { LxdInstance } from "types/instance";
import {
  getDependentDisksFromDevices,
  getVolumeName,
  replaceVolumeName,
} from "util/dependentDisks";

interface RemoteMigrationStorage {
  fields: ReactNode;
  devices: LxdDevices;
  hasErrors: boolean;
}

const findRootDisk = (
  devices?: LxdDevices,
): [string, LxdDiskDevice] | undefined => {
  const entry = Object.entries(devices ?? {}).find(([, device]) => {
    const disk = device as LxdDiskDevice;
    return disk.type === "disk" && disk.path === "/" && !disk.source;
  });
  return entry ? [entry[0], entry[1] as LxdDiskDevice] : undefined;
};

// Storage pools on the remote cluster, picked on the sending side so that the
// receiving side only has to paste the code within the source's 30 second
// connection timeout. The remote pools can't be listed from here, so the names
// are typed and default to the current ones.
export const useRemoteMigrationStorage = (
  instance: LxdInstance,
): RemoteMigrationStorage => {
  const { hasDependentDisks } = useSupportedFeatures();
  // The root disk can come from a profile, take it from the expanded devices so
  // the remote side gets the same size and pool.
  const rootDisk =
    findRootDisk(instance.devices) ?? findRootDisk(instance.expanded_devices);
  const dependentDisks = hasDependentDisks
    ? getDependentDisksFromDevices(instance.devices)
    : [];

  const [rootPool, setRootPool] = useState(rootDisk?.[1].pool ?? "");
  const [diskPools, setDiskPools] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      dependentDisks.map((disk) => [disk.name, disk.device.pool ?? ""]),
    ),
  );
  const [diskNames, setDiskNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      dependentDisks.map((disk) => [
        disk.name,
        getVolumeName(disk.device.source),
      ]),
    ),
  );

  const poolError = (pool?: string) =>
    (pool ?? "").trim() ? undefined : "Storage pool is required";
  const nameError = (name?: string) => {
    const value = (name ?? "").trim();
    if (!value) {
      return "Volume name is required";
    }
    return value.includes("/")
      ? "Volume name can't contain a slash"
      : undefined;
  };

  const rootError = rootDisk ? poolError(rootPool) : undefined;
  const diskErrors = dependentDisks.map((disk) => ({
    pool: poolError(diskPools[disk.name]),
    name: nameError(diskNames[disk.name]),
  }));
  const hasErrors =
    !!rootError || diskErrors.some((errors) => errors.pool || errors.name);

  const devices: LxdDevices = { ...instance.devices };
  if (rootDisk) {
    devices[rootDisk[0]] = { ...rootDisk[1], pool: rootPool.trim() };
  }
  dependentDisks.forEach((disk) => {
    devices[disk.name] = {
      ...disk.device,
      pool: (diskPools[disk.name] ?? "").trim(),
      source: replaceVolumeName(
        disk.device.source ?? "",
        (diskNames[disk.name] ?? "").trim(),
      ),
    };
  });

  const fields = (
    <div className="remote-migration-storage">
      <p className="u-text--muted">
        Storage pools on the remote cluster. They can&rsquo;t be listed from
        here, so type their names. You can still change them when receiving.
      </p>
      {rootDisk && (
        <Input
          id="remote-root-pool"
          type="text"
          label={
            <>
              Root storage pool (currently <b>{rootDisk[1].pool}</b>)
            </>
          }
          value={rootPool}
          onChange={(e) => {
            setRootPool(e.target.value);
          }}
          error={rootError}
        />
      )}
      {dependentDisks.map((disk, index) => (
        <div key={disk.name} className="copy-dependent-disk">
          <p className="u-no-margin--bottom">
            <b>{disk.name}</b>: volume{" "}
            <b>{getVolumeName(disk.device.source)}</b> in pool{" "}
            <b>{disk.device.pool}</b>
          </p>
          <div className="copy-dependent-disk-fields">
            <Input
              id={`remote-dependent-disk-pool-${disk.name}`}
              type="text"
              label="Storage pool"
              value={diskPools[disk.name] ?? ""}
              onChange={(e) => {
                setDiskPools((prev) => ({
                  ...prev,
                  [disk.name]: e.target.value,
                }));
              }}
              error={diskErrors[index].pool}
            />
            <Input
              id={`remote-dependent-disk-name-${disk.name}`}
              type="text"
              label="Volume name"
              value={diskNames[disk.name] ?? ""}
              onChange={(e) => {
                setDiskNames((prev) => ({
                  ...prev,
                  [disk.name]: e.target.value,
                }));
              }}
              error={diskErrors[index].name}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return { fields, devices, hasErrors };
};

import type { LxdInstance, LxdInstanceState } from "types/instance";
import type { LxdDevices, LxdDiskDevice } from "types/device";

export interface CpuSample {
  // ms since epoch
  time: number;
  // cpu time used, in ns
  usage: number;
}

export interface DiskUsage {
  usage: number;
  total: number;
}

// Percent of the allocated cpu time used between two state samples.
export const getCpuPercentage = (
  prev: CpuSample,
  next: CpuSample,
  allocatedTime: number,
): number | undefined => {
  const elapsedSeconds = (next.time - prev.time) / 1000;
  const usedNs = next.usage - prev.usage;

  if (elapsedSeconds <= 0 || allocatedTime <= 0 || usedNs < 0) {
    return undefined;
  }

  return Math.min(100, (100 * usedNs) / (elapsedSeconds * allocatedTime));
};

// Allocated cpu time per second in ns. Older servers lack allocated_time.
export const getCpuAllocatedTime = (
  instance: LxdInstance,
  state: LxdInstanceState,
): number => {
  if (state.cpu?.allocated_time && state.cpu.allocated_time > 0) {
    return state.cpu.allocated_time;
  }

  const limit = parseInt(instance.expanded_config?.["limits.cpu"] ?? "");
  const cores = Number.isNaN(limit) || limit <= 0 ? 1 : limit;
  return cores * 1e9;
};

const isRootDisk = (device: LxdDevices[string]): boolean => {
  if (device.type !== "disk") {
    return false;
  }
  const disk = device as LxdDiskDevice;
  return disk.path === "/" && !disk.source;
};

const getRootDiskName = (instance: LxdInstance): string | undefined => {
  const devices = Object.entries(instance.expanded_devices ?? {});
  return devices.find(([, device]) => isRootDisk(device))?.[0];
};

export const getRootDiskUsage = (
  instance: LxdInstance,
  state?: LxdInstanceState,
): DiskUsage | undefined => {
  if (!state?.disk) {
    return undefined;
  }

  const name = getRootDiskName(instance);
  const disk = name ? state.disk[name] : undefined;
  if (!disk) {
    return undefined;
  }

  return { usage: disk.usage, total: disk.total };
};

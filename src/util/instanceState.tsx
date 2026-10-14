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

export const getCpuCores = (
  instance: LxdInstance,
  state: LxdInstanceState,
): number => {
  return Math.max(1, Math.round(getCpuAllocatedTime(instance, state) / 1e9));
};

const cpuSamples = new Map<
  string,
  { sample: CpuSample; percentage?: number }
>();

// Keeps the last sample per instance, so list rows and panels share it
// and survive remounts. Undefined until a second sample arrived.
export const trackCpuUsage = (
  instance: LxdInstance,
  state: LxdInstanceState | undefined,
  updatedAt: number,
): number | undefined => {
  if (!state?.cpu || !updatedAt) {
    return undefined;
  }

  const key = `${instance.project}/${instance.name}`;
  const next = { time: updatedAt, usage: state.cpu.usage };
  const last = cpuSamples.get(key);
  if (last && last.sample.time === next.time) {
    return last.percentage;
  }

  const percentage = last
    ? getCpuPercentage(last.sample, next, getCpuAllocatedTime(instance, state))
    : undefined;
  cpuSamples.set(key, { sample: next, percentage });
  return percentage;
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

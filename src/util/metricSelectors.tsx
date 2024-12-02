import { LxdMetricGroup } from "types/metrics";
import { LxdInstance } from "types/instance";

interface MemoryReport {
  memory:
    | {
        free: number;
        total: number;
      }
    | undefined;
  disk:
    | {
        free: number;
        total: number;
      }
    | undefined;
}

export const getInstanceMetrics = (
  metrics: LxdMetricGroup[],
  instance: LxdInstance,
): MemoryReport => {
  const memValue = (metricKey: string) =>
    metrics
      .find((item) => item.name === metricKey)
      ?.metrics.find((item) => item.labels.name === instance.name)?.value;

  const memFree = memValue("incus_memory_MemFree_bytes");
  const memTotal = memValue("incus_memory_MemTotal_bytes");
  const memory =
    memFree && memTotal
      ? {
          free: memFree,
          total: memTotal,
        }
      : undefined;

  const diskValue = (metricKey: string) =>
    metrics
      .find((item) => item.name === metricKey)
      ?.metrics.find(
        (item) =>
          item.labels.name === instance.name && item.labels.mountpoint === "/",
      )?.value;

  const diskFree = diskValue("incus_filesystem_free_bytes");
  const diskTotal = diskValue("incus_filesystem_size_bytes");
  const disk =
    diskFree && diskTotal
      ? {
          free: diskFree,
          total: diskTotal,
        }
      : undefined;

  return {
    memory,
    disk,
  };
};

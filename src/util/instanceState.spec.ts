import type { LxdInstance, LxdInstanceState } from "types/instance";
import {
  getCpuAllocatedTime,
  getCpuCores,
  getCpuPercentage,
  getRootDiskUsage,
  trackCpuUsage,
} from "./instanceState";

describe("getCpuCores", () => {
  it("derives the core count from the allocated cpu time", () => {
    const instance = { expanded_config: {} } as unknown as LxdInstance;
    const state = {
      cpu: { usage: 0, allocated_time: 12e9 },
    } as unknown as LxdInstanceState;
    expect(getCpuCores(instance, state)).toBe(12);
  });
});

describe("trackCpuUsage", () => {
  const instance = {
    name: "web",
    project: "default",
    expanded_config: {},
  } as unknown as LxdInstance;
  const other = { ...instance, name: "db" } as unknown as LxdInstance;
  const stateAt = (usage: number) =>
    ({ cpu: { usage, allocated_time: 2e9 } }) as unknown as LxdInstanceState;

  it("needs two samples before it reports a percentage", () => {
    expect(trackCpuUsage(instance, stateAt(0), 1000)).toBeUndefined();
    expect(trackCpuUsage(instance, stateAt(5e9), 11000)).toBe(25);
  });

  it("keeps the percentage for repeated calls with the same sample", () => {
    expect(trackCpuUsage(instance, stateAt(5e9), 11000)).toBe(25);
    expect(trackCpuUsage(instance, stateAt(5e9), 11000)).toBe(25);
  });

  it("tracks instances independently", () => {
    expect(trackCpuUsage(other, stateAt(0), 11000)).toBeUndefined();
    expect(trackCpuUsage(other, stateAt(1e9), 12000)).toBe(50);
    expect(trackCpuUsage(instance, stateAt(5e9), 11000)).toBe(25);
  });

  it("returns undefined without state", () => {
    expect(trackCpuUsage(instance, undefined, 20000)).toBeUndefined();
  });

  it("ignores samples less than a second after the last one", () => {
    // list and panel poll the same instance, near simultaneous pairs are noise
    expect(trackCpuUsage(instance, stateAt(5.1e9), 11500)).toBe(25);
    expect(trackCpuUsage(instance, stateAt(10e9), 21000)).toBe(25);
  });
});

describe("getCpuAllocatedTime", () => {
  it("uses allocated_time from the state", () => {
    const instance = { expanded_config: {} } as unknown as LxdInstance;
    const state = {
      cpu: { usage: 0, allocated_time: 12e9 },
    } as unknown as LxdInstanceState;
    expect(getCpuAllocatedTime(instance, state)).toBe(12e9);
  });

  it("falls back to limits.cpu", () => {
    const instance = {
      expanded_config: { "limits.cpu": "4" },
    } as unknown as LxdInstance;
    const state = { cpu: { usage: 0 } } as unknown as LxdInstanceState;
    expect(getCpuAllocatedTime(instance, state)).toBe(4e9);
  });

  it("falls back to one core", () => {
    const instance = { expanded_config: {} } as unknown as LxdInstance;
    const state = { cpu: { usage: 0 } } as unknown as LxdInstanceState;
    expect(getCpuAllocatedTime(instance, state)).toBe(1e9);
  });
});

describe("getCpuPercentage", () => {
  it("computes percent of allocated cpu time between two samples", () => {
    // 15 s apart, 2 cores allocated, 7.5 cpu seconds used -> 25 %
    const prev = { time: 0, usage: 0 };
    const next = { time: 15000, usage: 7.5e9 };
    expect(getCpuPercentage(prev, next, 2e9)).toBe(25);
  });

  it("returns undefined without elapsed time", () => {
    const sample = { time: 1000, usage: 5e9 };
    expect(getCpuPercentage(sample, sample, 1e9)).toBeUndefined();
  });

  it("returns undefined without allocated cpu time", () => {
    const prev = { time: 0, usage: 0 };
    const next = { time: 1000, usage: 1e9 };
    expect(getCpuPercentage(prev, next, 0)).toBeUndefined();
  });

  it("returns undefined when the counter went backwards", () => {
    const prev = { time: 0, usage: 9e9 };
    const next = { time: 1000, usage: 1e9 };
    expect(getCpuPercentage(prev, next, 1e9)).toBeUndefined();
  });

  it("clamps to 100", () => {
    const prev = { time: 0, usage: 0 };
    const next = { time: 1000, usage: 5e9 };
    expect(getCpuPercentage(prev, next, 1e9)).toBe(100);
  });
});

describe("getRootDiskUsage", () => {
  const instance = {
    expanded_devices: {
      eth0: { type: "nic", network: "incusbr0" },
      root: { type: "disk", path: "/", pool: "default" },
    },
  } as unknown as LxdInstance;

  it("returns usage and total of the root disk device", () => {
    const state = {
      disk: { root: { usage: 9e9, total: 3e10 } },
    } as unknown as LxdInstanceState;
    expect(getRootDiskUsage(instance, state)).toEqual({
      usage: 9e9,
      total: 3e10,
    });
  });

  it("returns undefined when the state has no entry for the root disk", () => {
    const state = { disk: {} } as unknown as LxdInstanceState;
    expect(getRootDiskUsage(instance, state)).toBeUndefined();
  });

  it("returns undefined without state", () => {
    expect(getRootDiskUsage(instance, undefined)).toBeUndefined();
  });
});

import type { LxdInstance, LxdInstanceState } from "types/instance";
import {
  getCpuAllocatedTime,
  getCpuPercentage,
  getRootDiskUsage,
} from "./instanceState";

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

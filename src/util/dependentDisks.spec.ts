import type { LxdInstance } from "types/instance";
import type { LxdProject } from "types/project";
import {
  getDependentDisks,
  getDependentDisksFromDevices,
  getVolumeName,
  isSharingVolumes,
  replaceVolumeName,
} from "./dependentDisks";

describe("dependentDisks", () => {
  it("lists only dependent custom volume disks", () => {
    const instance = {
      devices: {
        root: { type: "disk", path: "/", pool: "default" },
        data: {
          type: "disk",
          path: "/data",
          pool: "default",
          source: "vol1",
          dependent: "true",
        },
        other: {
          type: "disk",
          path: "/other",
          pool: "default",
          source: "vol2",
        },
        flag: {
          type: "disk",
          path: "/flag",
          pool: "fast",
          source: "vol3",
          dependent: "yes",
        },
        eth0: { type: "nic", network: "incusbr0" },
      },
    } as unknown as LxdInstance;

    expect(getDependentDisks(instance).map((disk) => disk.name)).toEqual([
      "data",
      "flag",
    ]);
  });

  it("renames only the volume part of a source", () => {
    expect(getVolumeName("vol1")).toBe("vol1");
    expect(getVolumeName("vol1/snap0")).toBe("vol1");
    expect(replaceVolumeName("vol1", "new")).toBe("new");
    expect(replaceVolumeName("vol1/snap0", "new")).toBe("new/snap0");
  });

  it("detects projects sharing custom volumes", () => {
    const projects = [
      { name: "default", config: {} },
      { name: "shared", config: {} },
      { name: "isolated", config: { "features.storage.volumes": "true" } },
    ] as unknown as LxdProject[];

    expect(isSharingVolumes("default", "default", projects)).toBe(true);
    expect(isSharingVolumes("default", "shared", projects)).toBe(true);
    expect(isSharingVolumes("default", "isolated", projects)).toBe(false);
    expect(isSharingVolumes("default", "unknown", projects)).toBe(true);
  });

  it("lists dependent disks from a plain device map", () => {
    expect(getDependentDisksFromDevices(undefined)).toEqual([]);
    const disks = getDependentDisksFromDevices({
      root: { type: "disk", path: "/", pool: "default" },
      data: {
        type: "disk",
        path: "/data",
        pool: "fast",
        source: "vol1",
        dependent: "yes",
      },
    });
    expect(disks.map((disk) => disk.name)).toEqual(["data"]);
  });
});

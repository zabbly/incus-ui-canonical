import type { LxdInstance } from "types/instance";
import type { LxdDevices, LxdDiskDevice } from "types/device";
import type { LxdProject } from "types/project";
import { isProjectWithVolumes } from "util/projects";

export interface DependentDisk {
  name: string;
  device: LxdDiskDevice;
}

// Values Incus accepts as true for boolean config keys
const isTrueValue = (value?: string): boolean =>
  ["true", "1", "yes", "on"].includes(value?.toLowerCase() ?? "");

// Dependent disks are tied to a single instance, so they only live in its local devices.
export const getDependentDisks = (instance: LxdInstance): DependentDisk[] =>
  getDependentDisksFromDevices(instance.devices);

export const getDependentDisksFromDevices = (
  devices?: LxdDevices,
): DependentDisk[] =>
  Object.entries(devices ?? {})
    .filter(([, device]) => {
      if (device.type !== "disk") {
        return false;
      }
      const disk = device as LxdDiskDevice;
      return (
        isTrueValue(disk.dependent) &&
        disk.path !== "/" &&
        !!disk.pool &&
        !!disk.source
      );
    })
    .map(([name, device]) => ({ name, device: device as LxdDiskDevice }))
    .sort((a, b) => a.name.localeCompare(b.name));

// A disk source can be "volume" or "volume/suffix", only the volume part is renamed.
export const getVolumeName = (source?: string): string =>
  (source ?? "").split("/")[0];

export const replaceVolumeName = (source: string, name: string): string => {
  const slash = source.indexOf("/");
  return slash === -1 ? name : `${name}${source.slice(slash)}`;
};

// The project whose custom volumes a project uses.
const getVolumeProject = (projectName: string, projects: LxdProject[]) => {
  const project = projects.find((item) => item.name === projectName);
  if (!project) {
    return undefined;
  }
  return isProjectWithVolumes(project) ? project.name : "default";
};

// Whether two projects share their custom storage volumes. Unknown projects count as shared.
export const isSharingVolumes = (
  sourceProject: string,
  targetProject: string,
  projects: LxdProject[],
): boolean => {
  if (sourceProject === targetProject) {
    return true;
  }
  const source = getVolumeProject(sourceProject, projects);
  const target = getVolumeProject(targetProject, projects);
  if (!source || !target) {
    return true;
  }
  return source === target;
};

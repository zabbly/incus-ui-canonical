import { LxdInstance } from "types/instance";
import { LxdOperation } from "types/operation";

export const getInstanceName = (operation?: LxdOperation): string => {
  // the url can be one of below formats
  // /1.0/instances/<instance_name>
  // /1.0/instances/<instance_name>?project=<project_name>
  return (
    operation?.resources?.instances
      ?.filter((item) => item.startsWith("/1.0/instances/"))
      .map((item) => item.split("/")[3])
      .pop()
      ?.split("?")[0] ?? ""
  );
};

export const getInstanceSnapshotName = (operation?: LxdOperation): string => {
  // /1.0/instances/<instance_name>/snapshots/<snapshot_name>
  const instanceSnapshots = operation?.resources?.instances_snapshots ?? [];
  if (instanceSnapshots.length) {
    return instanceSnapshots[0].split("/")[5].split("?")[0];
  }

  return "";
};

export const getVolumeSnapshotName = (operation?: LxdOperation): string => {
  // /1.0/storage-pools/<pool_name>/volumes/custom/<volume_name>/snapshots/<snapshot_name>
  const storageVolumeSnapshots =
    operation?.resources?.storage_volume_snapshots ?? [];

  if (storageVolumeSnapshots.length) {
    return storageVolumeSnapshots[0].split("/")[8].split("?")[0];
  }

  return "";
};

export const getProjectName = (operation: LxdOperation): string => {
  // the url can be
  // /1.0/instances/<instance_name>?project=<project_name>
  // /1.0/instances/<instance_name>?other=params&project=<project_name>
  // /1.0/instances/testInstance1?other=params&project=<project_name>&other=params
  // when no project parameter is present, the project will be "default"

  return (
    operation.resources?.instances
      ?.filter((item) => item.startsWith("/1.0/instances/"))
      .map((item) => item.split("project=")[1])
      .pop()
      ?.split("&")[0] ?? "default"
  );
};

export const findOperation = (instance: LxdInstance, operations: LxdOperation[], operation_type: string) => {
  return operations.find((operation) => {
    const projectName = getProjectName(operation);
    const instanceName = getInstanceName(operation);

    if (projectName == instance.project && instanceName == instance.name && operation_type == operation.description) {
      return true;
    }
    return false;
  });
}

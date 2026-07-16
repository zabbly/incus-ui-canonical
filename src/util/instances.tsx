import type { AbortControllerState } from "util/helpers";
import { checkDuplicateName } from "util/helpers";
import { ROOT_PATH } from "util/rootPath";
import * as Yup from "yup";
import type { LxdInstance } from "types/instance";
import { instanceCreationTypes } from "./instanceOptions";
import { getInstanceLocation } from "./instanceLocation";
import type { InstanceAndProfileFormikProps } from "types/forms/instanceAndProfileFormProps";

export const CLUSTER_GROUP_PREFIX = "@";

export const linkForInstanceDetail = (name: string, project?: string) => {
  return `${ROOT_PATH}/ui/project/${encodeURIComponent(project ?? "default")}/instance/${encodeURIComponent(name)}`;
};

export const instanceNameValidation = (
  project: string,
  controllerState: AbortControllerState,
  oldName?: string,
): Yup.StringSchema =>
  Yup.string()
    .test(
      "deduplicate",
      "An instance with this name already exists",
      async (value, context) => {
        // in some cases like copy instance or create instance from snapshot
        // we let the user choose a target project in the form. We should use
        // the target project instead of the current project in those cases.
        const targetProject =
          (context.parent as { targetProject?: string }).targetProject ??
          project;

        return (
          oldName === value ||
          checkDuplicateName(value, targetProject, controllerState, "instances")
        );
      },
    )
    .test(
      "size",
      "Instance name must be between 1 and 63 characters",
      (value) => !value || value.length < 64,
    )
    .matches(/^[A-Za-z0-9-]+$/, {
      message: "Only alphanumeric and hyphen characters are allowed",
    })
    .matches(/^[A-Za-z].*$/, {
      message: "Instance name must start with a letter",
    });

export const getInstanceKey = (instance: LxdInstance) => {
  return `${instance.name} ${instance.project}`;
};

export const getInstanceMacAddresses = (instance: LxdInstance) => {
  const hwaddrs = [];

  for (const [key, value] of Object.entries(instance.config)) {
    if (
      key.startsWith("volatile.") &&
      key.endsWith(".hwaddr") &&
      key.split(".").length === 3 &&
      value
    ) {
      hwaddrs.push(value);
    }
  }
  return hwaddrs;
};

export const getInstanceType = (instance: LxdInstance): string => {
  const label = instanceCreationTypes.find(
    (item) => item.value === instance.type,
  )?.label;

  if (instance.config?.["volatile.container.oci"] === "true") {
    return `${label} (App)`;
  }

  return label ? label : "";
};

export const getInstanceClusterMember = (
  formik: InstanceAndProfileFormikProps,
) => {
  const location = getInstanceLocation(formik);
  if (!location || location === "any") {
    return undefined;
  }
  const isClusterGroup = location?.startsWith(CLUSTER_GROUP_PREFIX);
  if (isClusterGroup) {
    return undefined;
  }
  return location;
};

export const instanceIncludeConfigWhenCopying = (
  configKey: string,
): boolean => {
  if (configKey === "volatile.base_image") {
    return true; // Include volatile.base_image always as it can help optimize copies.
  }

  if (configKey === "volatile.last_state.idmap") {
    return true; // Include volatile.last_state.idmap when doing local copy to avoid needless remapping.
  }

  if (configKey.startsWith("volatile.")) {
    return false; // Exclude all other volatile keys.
  }

  return true; // Keep all other keys.
};

export const isWindowsInstance = (instance: LxdInstance): boolean => {
  const os = instance.config?.["image.os"]?.toLowerCase() || "";
  return os.includes("windows");
};

export const getInstanceOSName = (instance: LxdInstance): string => {
  if (instance.state?.os_info?.os) {
    return `${instance.state.os_info.os} ${instance.state.os_info?.os_version}`;
  }

  if (instance.config?.["image.description"]) {
    return instance.config["image.description"];
  }

  if (instance.config?.["image.os"]) {
    return instance.config["image.os"];
  }

  return "";
};

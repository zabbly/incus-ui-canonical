import type { LxdInstance } from "types/instance";
import type { AbortControllerState } from "./helpers";
import { checkDuplicateName } from "./helpers";
import * as Yup from "yup";
import { testFutureDate, testValidDate, testValidTime } from "./snapshots";

/*** Instance snapshot utils ***/
export const isInstanceStateful = (instance: LxdInstance): boolean => {
  return Boolean(instance.expanded_config["migration.stateful"]);
};

export const testDuplicateInstanceSnapshotName = (
  instance: LxdInstance,
  controllerState: AbortControllerState,
  excludeName?: string,
): [string, string, Yup.TestFunction<string | undefined, Yup.AnyObject>] => {
  return [
    "deduplicate",
    "Snapshot name already in use",
    async (value?: string) => {
      return (
        (excludeName && value === excludeName) ||
        checkDuplicateName(
          value,
          instance.project,
          controllerState,
          `instances/${instance.name}/snapshots`,
        )
      );
    },
  ];
};

export const getInstanceSnapshotSchema = (
  instance: LxdInstance,
  controllerState: AbortControllerState,
  snapshotName?: string,
) => {
  return Yup.object().shape({
    name: Yup.string()
      .test(
        ...testDuplicateInstanceSnapshotName(
          instance,
          controllerState,
          snapshotName,
        ),
      )
      .matches(/^[A-Za-z0-9-_.:]+$/, {
        message:
          "Only alphanumeric characters, underscores, periods, hyphens, and colons are allowed in this field",
      }),
    expirationDate: Yup.string()
      .nullable()
      .optional()
      .test(...testValidDate())
      .test(...testFutureDate()),
    expirationTime: Yup.string()
      .nullable()
      .optional()
      .test(...testValidTime()),
    stateful: Yup.boolean(),
  });
};

import { useState, type FC } from "react";
import type { LxdInstance, InstanceIconType } from "types/instance";
import { useFormik } from "formik";
import {
  ActionButton,
  Button,
  CheckboxInput,
  Form,
  Input,
  Modal,
  Select,
  useToastNotification,
} from "@canonical/react-components";
import * as Yup from "yup";
import { createInstance } from "api/instances";
import { useNavigate } from "react-router-dom";
import {
  instanceIncludeConfigWhenCopying,
  instanceNameValidation,
} from "util/instances";
import type { LxdDiskDevice } from "types/device";
import { useEventQueue } from "context/eventQueue";
import ClusterMemberSelector from "pages/cluster/ClusterMemberSelector";
import { getUniqueResourceName, truncateEntityName } from "util/helpers";
import { ROOT_PATH } from "util/rootPath";
import ResourceLink from "components/ResourceLink";
import StoragePoolSelector from "pages/storage/StoragePoolSelector";
import { useInstances } from "context/useInstances";
import { useProjects } from "context/useProjects";
import { useProjectEntitlements } from "util/entitlements/projects";
import { useStoragePools } from "context/useStoragePools";
import { useIsClustered } from "context/useIsClustered";
import { InstanceRichChip } from "../InstanceRichChip";
import { isRootDisk } from "util/devices";
import { encodeServerFilters } from "util/instanceFilter";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import {
  getDependentDisks,
  getVolumeName,
  isSharingVolumes,
  replaceVolumeName,
} from "util/dependentDisks";
import DependentDiskCopyFields from "./DependentDiskCopyFields";

interface Props {
  instance: LxdInstance;
  close: () => void;
}

export interface LxdInstanceCopy {
  instanceName: string;
  targetProject: string;
  targetClusterMember?: string;
  targetStoragePool: string;
  allowInconsistent: boolean;
  instanceOnly: boolean;
  // Pool picked for a dependent disk, disks without an entry stay in their current pool.
  dependentDiskPools: Record<string, string>;
  dependentDiskNames: Record<string, string>;
}

const CopyInstanceForm: FC<Props> = ({ instance, close }) => {
  const toastNotify = useToastNotification();
  const isClustered = useIsClustered();
  const controllerState = useState<AbortController | null>(null);
  const navigate = useNavigate();
  const eventQueue = useEventQueue();
  const { hasDependentDisks } = useSupportedFeatures();
  const dependentDisks = hasDependentDisks ? getDependentDisks(instance) : [];

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { canCreateInstances } = useProjectEntitlements();

  const { data: storagePools = [], isLoading: storagePoolsLoading } =
    useStoragePools(true);

  const { data: instances = [] } = useInstances(
    instance.project,
    encodeServerFilters([""]),
  );

  const notifySuccess = (
    name: string,
    project: string,
    type: InstanceIconType,
  ) => {
    const instanceUrl = `${ROOT_PATH}/ui/project/${encodeURIComponent(project)}/instance/${encodeURIComponent(name)}`;
    const message = (
      <>
        Created instance{" "}
        <ResourceLink type={type} value={name} to={instanceUrl} />.
      </>
    );

    const actions = [
      {
        label: "Configure",
        onClick: async () => navigate(`${instanceUrl}/configuration`),
      },
    ];

    toastNotify.success(message, actions);
  };

  const getCopiedInstanceName = (instance: LxdInstance): string => {
    const newInstanceName = truncateEntityName(instance.name, "-copy");
    return getUniqueResourceName(newInstanceName, instances);
  };

  // Dependent disks stay in their current pool unless a different pool was picked for them.
  const getDependentDiskPool = (
    values: LxdInstanceCopy,
    disk: string,
    currentPool?: string,
  ): string =>
    values.dependentDiskPools[disk] ??
    (currentPool || values.targetStoragePool || "");

  const formik = useFormik<LxdInstanceCopy>({
    initialValues: {
      instanceName: getCopiedInstanceName(instance),
      targetProject: instance.project,
      allowInconsistent: false,
      instanceOnly: false,
      dependentDiskPools: {},
      dependentDiskNames: Object.fromEntries(
        dependentDisks.map((disk) => [
          disk.name,
          `${getVolumeName(disk.device.source)}-copy`,
        ]),
      ),
      targetClusterMember: isClustered ? instance.location : "",
      targetStoragePool:
        (instance.devices["root"] as LxdDiskDevice)?.pool ??
        storagePools[0]?.name,
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      instanceName: instanceNameValidation(
        instance.project,
        controllerState,
      ).required(),
    }),
    validate: (values) => {
      const nameErrors: Record<string, string> = {};
      const sharedVolumes = isSharingVolumes(
        instance.project,
        values.targetProject,
        projects,
      );
      dependentDisks.forEach((disk) => {
        const name = values.dependentDiskNames[disk.name]?.trim() ?? "";
        if (!name) {
          nameErrors[disk.name] = "Volume name is required";
        } else if (name.includes("/")) {
          nameErrors[disk.name] = "Volume name can't contain a slash";
        } else if (
          sharedVolumes &&
          getDependentDiskPool(values, disk.name, disk.device.pool) ===
            disk.device.pool &&
          name === getVolumeName(disk.device.source)
        ) {
          nameErrors[disk.name] =
            "A new name is required when copying the volume into the same pool";
        }
      });
      return Object.keys(nameErrors).length > 0
        ? { dependentDiskNames: nameErrors }
        : {};
    },
    onSubmit: (values) => {
      const instanceLink = (
        <InstanceRichChip
          instanceName={instance.name}
          projectName={instance.project}
        />
      );
      const config = Object.fromEntries(
        Object.entries(instance.config).filter(([key, _]) =>
          instanceIncludeConfigWhenCopying(key),
        ),
      );

      let rootDiskName = "";
      const devices = Object.fromEntries(
        Object.entries(instance.devices).map(([key, value]) => {
          if (isRootDisk(value)) {
            rootDiskName = key;
            if (values.targetStoragePool !== "") {
              return [key, { ...value, pool: values.targetStoragePool }];
            }
          }

          const dependentDisk = dependentDisks.find(
            (disk) => disk.name === key,
          );
          if (dependentDisk) {
            const source = dependentDisk.device.source ?? "";
            const name = values.dependentDiskNames[key]?.trim() ?? "";
            return [
              key,
              {
                ...value,
                pool: getDependentDiskPool(
                  values,
                  key,
                  dependentDisk.device.pool,
                ),
                source: replaceVolumeName(source, name),
              },
            ];
          }

          return [key, value];
        }),
      );

      if (rootDiskName === "" && values.targetStoragePool !== "") {
        devices["root"] = {
          path: "/",
          type: "disk",
          pool: values.targetStoragePool,
        };
      }

      createInstance(
        JSON.stringify({
          description: instance.description,
          name: values.instanceName,
          architecture: instance.architecture,
          ephemeral: instance.ephemeral,
          type: instance.type,
          profiles: [...instance.profiles],
          config: {
            ...config,
          },
          source: {
            allow_inconsistent: values.allowInconsistent,
            instance_only: values.instanceOnly,
            source: instance.name,
            type: "copy",
            project: instance.project,
          },
          devices: {
            ...devices,
          },
        }),
        values.targetProject,
        values.targetClusterMember,
      )
        .then((operation) => {
          toastNotify.info(<>Copy of instance {instanceLink} started.</>);
          eventQueue.set(
            operation.metadata.id,
            () => {
              notifySuccess(
                values.instanceName,
                values.targetProject,
                instance.type,
              );
            },
            (msg) =>
              toastNotify.failure(
                "Instance copy failed.",
                new Error(msg),
                instanceLink,
              ),
          );
        })
        .catch((e) => {
          toastNotify.failure("Instance copy failed.", e, instanceLink);
        })
        .finally(() => {
          close();
        });
    },
  });

  return (
    <Modal
      close={close}
      className="copy-instances-modal"
      title="Copy Instance"
      buttonRow={
        <>
          <Button
            appearance="base"
            className="u-no-margin--bottom"
            type="button"
            onClick={close}
          >
            Cancel
          </Button>
          <ActionButton
            appearance="positive"
            className="u-no-margin--bottom"
            loading={formik.isSubmitting}
            disabled={
              !formik.isValid ||
              formik.isSubmitting ||
              storagePoolsLoading ||
              projectsLoading
            }
            onClick={() => void formik.submitForm()}
          >
            Copy
          </ActionButton>
        </>
      }
    >
      <Form onSubmit={formik.handleSubmit}>
        <Input
          {...formik.getFieldProps("instanceName")}
          type="text"
          label="New instance name"
          error={
            formik.touched.instanceName ? formik.errors.instanceName : null
          }
        />
        <ClusterMemberSelector
          {...formik.getFieldProps("targetClusterMember")}
          id="targetClusterMember"
          label="Target cluster member"
        />
        <StoragePoolSelector
          {...formik.getFieldProps("targetStoragePool")}
          setValue={(value) =>
            void formik.setFieldValue("targetStoragePool", value)
          }
          selectProps={{
            id: "storagePool",
            label: "Storage pool",
          }}
        />
        <DependentDiskCopyFields
          disks={dependentDisks}
          pools={Object.fromEntries(
            dependentDisks.map((disk) => [
              disk.name,
              getDependentDiskPool(formik.values, disk.name, disk.device.pool),
            ]),
          )}
          names={formik.values.dependentDiskNames}
          errors={
            (formik.errors.dependentDiskNames ?? {}) as Record<
              string,
              string | undefined
            >
          }
          setPool={(disk, pool) =>
            void formik.setFieldValue("dependentDiskPools", {
              ...formik.values.dependentDiskPools,
              [disk]: pool,
            })
          }
          setName={(disk, name) =>
            void formik.setFieldValue("dependentDiskNames", {
              ...formik.values.dependentDiskNames,
              [disk]: name,
            })
          }
        />
        <Select
          {...formik.getFieldProps("targetProject")}
          id="project"
          label="Target project"
          options={projects.filter(canCreateInstances).map((project) => {
            return {
              label: project.name,
              value: project.name,
            };
          })}
        />
        <CheckboxInput
          {...formik.getFieldProps("allowInconsistent")}
          label="Ignore copy errors for volatile files"
          error={
            formik.touched.allowInconsistent
              ? formik.errors.allowInconsistent
              : null
          }
        />
        <CheckboxInput
          {...formik.getFieldProps("instanceOnly")}
          label="Copy without instance snapshots"
          error={
            formik.touched.instanceOnly ? formik.errors.instanceOnly : null
          }
        />
        {/* hidden submit to enable enter key in inputs */}
        <Input type="submit" hidden value="Hidden input" />
      </Form>
    </Modal>
  );
};

export default CopyInstanceForm;

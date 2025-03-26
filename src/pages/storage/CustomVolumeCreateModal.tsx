import { FC, useEffect, useState } from "react";
import { ActionButton, Button, useNotify } from "@canonical/react-components";
import {
  StorageVolumeFormValues,
  volumeFormToPayload,
} from "pages/storage/forms/StorageVolumeForm";
import { useFormik } from "formik";
import { createStorageVolume, fetchStoragePools } from "api/storage-pools";
import { queryKeys } from "util/queryKeys";
import * as Yup from "yup";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StorageVolumeFormMain from "pages/storage/forms/StorageVolumeFormMain";
import { updateMaxHeight } from "util/updateMaxHeight";
import useEventListener from "util/useEventListener";
import { testDuplicateStorageVolumeName } from "util/storageVolume";
import { LxdStorageVolume } from "types/storage";
import { useSettings } from "context/useSettings";
import { isLocalPool } from "util/storagePool";

interface Props {
  project: string;
  instanceLocation?: string;
  onCancel: () => void;
  onFinish: (volume: LxdStorageVolume) => void;
}

const CustomVolumeCreateModal: FC<Props> = ({
  project,
  instanceLocation,
  onCancel,
  onFinish,
}) => {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const controllerState = useState<AbortController | null>(null);

  const { data: settings } = useSettings();

  const { data: pools = [] } = useQuery({
    queryKey: [queryKeys.storage],
    queryFn: () => fetchStoragePools(),
  });

  const StorageVolumeSchema = Yup.object().shape({
    name: Yup.string()
      .test(
        ...testDuplicateStorageVolumeName(project, "custom", controllerState),
      )
      .required("This field is required"),
  });

  const formik = useFormik<StorageVolumeFormValues>({
    initialValues: {
      content_type: "filesystem",
      name: "",
      project: project,
      pool: "",
      size: "GiB",
      volumeType: "custom",
      readOnly: false,
      isCreating: true,
      entityType: "storageVolume",
    },
    validationSchema: StorageVolumeSchema,
    onSubmit: (values) => {
      const volume = volumeFormToPayload(values, project);
      const pool = pools.find((pool) => pool.name === values.pool);
      const target = isLocalPool(pool, settings) ? instanceLocation : undefined;

      createStorageVolume(values.pool, project, volume, target)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [queryKeys.storage],
          });
          void queryClient.invalidateQueries({
            queryKey: [queryKeys.customVolumes, project],
          });
          notify.success(`Storage volume ${values.name} created.`);
          onFinish(volume);
        })
        .catch((e) => {
          notify.failure("Storage volume creation failed", e);
        })
        .finally(() => formik.setSubmitting(false));
    },
  });

  const pool = pools.find((pool) => pool.name === formik.values.pool);
  const validPool = !isLocalPool(pool, settings) || instanceLocation !== "any";
  const poolError = validPool
    ? undefined
    : "Please select a remote storage pool, or set a cluster member for the instance";

  const updateFormHeight = () => {
    updateMaxHeight("volume-create-form", "p-modal__footer", 32, undefined, []);
  };
  useEffect(updateFormHeight, [notify.notification?.message]);
  useEventListener("resize", updateFormHeight);

  return (
    <>
      <div className="volume-create-form">
        <StorageVolumeFormMain
          formik={formik}
          poolError={poolError}
          showClusterMember={false}
        />
      </div>
      <footer className="p-modal__footer">
        <Button
          appearance="base"
          className="u-no-margin--bottom"
          onClick={onCancel}
        >
          Back
        </Button>
        <ActionButton
          appearance="positive"
          className="u-no-margin--bottom"
          onClick={() => void formik.submitForm()}
          disabled={!formik.isValid || !validPool}
          loading={formik.isSubmitting}
        >
          Create volume
        </ActionButton>
      </footer>
    </>
  );
};

export default CustomVolumeCreateModal;

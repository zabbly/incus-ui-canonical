import { AbortControllerState, checkDuplicateName } from "util/helpers";
import { AnyObject, TestFunction } from "yup";
import { LxdConfigOptionsKeys } from "types/config";
import { LxdSettings } from "types/server";
import { LxdStoragePool } from "types/storage";
import { FormikProps } from "formik";
import { StoragePoolFormValues } from "pages/storage/forms/StoragePoolForm";
import { powerFlex } from "util/storageOptions";

export const storagePoolFormFieldToPayloadName: Record<string, string> = {
  ceph_cluster_name: "ceph.cluster_name",
  ceph_osd_pg_num: "ceph.osd.pg_num",
  ceph_rbd_clone_copy: "ceph.rbd.clone_copy",
  ceph_user_name: "ceph.user.name",
  ceph_rbd_features: "ceph.rbd.features",
  cephfs_cluster_name: "cephfs.cluster_name",
  cephfs_create_missing: "cephfs.create_missing",
  cephfs_fscache: "cephfs.fscache",
  cephfs_osd_pg_num: "cephfs.osd_pg_num",
  cephfs_path: "cephfs.path",
  cephfs_user_name: "cephfs.user.name",
  powerflex_clone_copy: "powerflex.clone_copy",
  powerflex_domain: "powerflex.domain",
  powerflex_gateway: "powerflex.gateway",
  powerflex_gateway_verify: "powerflex.gateway.verify",
  powerflex_mode: "powerflex.mode",
  powerflex_pool: "powerflex.pool",
  powerflex_sdt: "powerflex.sdt",
  powerflex_user_name: "powerflex.user.name",
  powerflex_user_password: "powerflex.user.password",
  zfs_clone_copy: "zfs.clone_copy",
  zfs_export: "zfs.export",
  zfs_pool_name: "zfs.pool_name",
};

export const getPoolKey = (formField: string): string => {
  if (!(formField in storagePoolFormFieldToPayloadName)) {
    throw new Error(
      `Could not find ${formField} in storagePoolFormFieldToPayloadName`,
    );
  }
  return storagePoolFormFieldToPayloadName[formField];
};

export const getCephPoolFormFields = () => {
  return Object.keys(storagePoolFormFieldToPayloadName).filter((item) =>
    item.startsWith("ceph_"),
  );
};

const storagePoolDriverToOptionKey: Record<string, LxdConfigOptionsKeys> = {
  dir: "storage-dir",
  btrfs: "storage-btrfs",
  lvm: "storage-lvm",
  zfs: "storage-zfs",
  ceph: "storage-ceph",
  cephfs: "storage-cephfs",
  powerflex: "storage-powerflex",
  lvmcluster: "storage-lvmcluster",
};

export const storagePoolFormDriverToOptionKey = (
  driver: string,
): LxdConfigOptionsKeys => {
  if (!(driver in storagePoolDriverToOptionKey)) {
    throw new Error(`Could not find ${driver} in storagePoolDriverToOptionKey`);
  }
  return storagePoolDriverToOptionKey[driver];
};

export const testDuplicateStoragePoolName = (
  project: string,
  controllerState: AbortControllerState,
): [string, string, TestFunction<string | undefined, AnyObject>] => {
  return [
    "deduplicate",
    "A storage pool with this name already exists",
    (value?: string) => {
      return checkDuplicateName(
        value,
        project,
        controllerState,
        `storage-pools`,
      );
    },
  ];
};

export const isPowerflexIncomplete = (
  formik: FormikProps<StoragePoolFormValues>,
): boolean => {
  return (
    formik.values.driver === powerFlex &&
    (!formik.values.powerflex_pool ||
      !formik.values.powerflex_gateway ||
      !formik.values.powerflex_user_password)
  );
};

export const isLocalPool = (
  pool: LxdStoragePool | undefined,
  settings: LxdSettings | undefined,
) => {
  const driverDetails = settings?.environment?.storage_supported_drivers.find(
    (driver) => driver.Name === pool?.driver,
  );

  if (!driverDetails) {
    return false;
  }
  return !driverDetails.Remote;
};

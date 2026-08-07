import type { AbortControllerState } from "util/helpers";
import { checkDuplicateName } from "util/helpers";
import type { AnyObject, TestFunction } from "yup";
import type { LxdConfigOptionsKeys } from "types/config";
import type { LxdSettings } from "types/server";
import type { LxdStoragePool } from "types/storage";
import type { FormikProps } from "formik";
import type { StoragePoolFormValues } from "types/forms/storagePool";
import {
  btrfsDriver,
  cephDriver,
  cephFSDriver,
  cephObject,
  dirDriver,
  linstorDriver,
  lvmDriver,
  lvmClusterDriver,
  truenasDriver,
  zfsDriver,
} from "util/storageOptions";

export const storagePoolFormFieldToPayloadName: Record<string, string> = {
  ceph_cluster_name: "ceph.cluster_name",
  ceph_osd_pg_num: "ceph.osd.pg_num",
  ceph_osd_pool_name: "ceph.osd.pool_name",
  ceph_rbd_clone_copy: "ceph.rbd.clone_copy",
  ceph_rbd_du: "ceph.rbd.du",
  ceph_user_name: "ceph.user.name",
  ceph_rbd_features: "ceph.rbd.features",
  cephfs_cluster_name: "cephfs.cluster_name",
  cephfs_create_missing: "cephfs.create_missing",
  cephfs_fscache: "cephfs.fscache",
  cephfs_osd_pg_num: "cephfs.osd_pg_num",
  cephfs_path: "cephfs.path",
  cephfs_user_name: "cephfs.user.name",
  cephobject_radosgw_endpoint: "cephobject.radosgw.endpoint",
  cephobject_cluster_name: "cephobject.cluster_name",
  cephobject_user_name: "cephobject.user.name",
  cephobject_bucket_name_prefix: "cephobject.bucket.name_prefix",
  zfs_clone_copy: "zfs.clone_copy",
  zfs_export: "zfs.export",
  zfs_pool_name: "zfs.pool_name",
};

export const isClusterLocalDriver = (poolDriver: string) => {
  const clusterLocalDrivers = [btrfsDriver, dirDriver, lvmDriver, zfsDriver];
  return clusterLocalDrivers.includes(poolDriver);
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

export const getCephObjectPoolFormFields = () => {
  return Object.keys(storagePoolFormFieldToPayloadName).filter((item) =>
    item.startsWith("cephobject_"),
  );
};

export const getZfsStoragePoolFormFields = () => {
  return Object.keys(storagePoolFormFieldToPayloadName).filter((item) =>
    item.startsWith("zfs_"),
  );
};

const storagePoolDriverToOptionKey: Record<string, LxdConfigOptionsKeys> = {
  [dirDriver]: "storage-dir",
  [btrfsDriver]: "storage-btrfs",
  [lvmDriver]: "storage-lvm",
  [zfsDriver]: "storage-zfs",
  [cephDriver]: "storage-ceph",
  [cephFSDriver]: "storage-cephfs",
  [cephObject]: "storage-cephobject",
  [lvmClusterDriver]: "storage-lvmcluster",
  [linstorDriver]: "storage-linstor",
  [truenasDriver]: "storage-truenas",
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
    async (value?: string) => {
      return checkDuplicateName(
        value,
        project,
        controllerState,
        `storage-pools`,
      );
    },
  ];
};

export const isCephObjectIncomplete = (
  formik: FormikProps<StoragePoolFormValues>,
): boolean => {
  return (
    formik.values.driver === cephObject &&
    !formik.values.cephobject_radosgw_endpoint
  );
};

export const isCephDriver = (values: StoragePoolFormValues) => {
  return values.driver === cephDriver;
};

export const isCephFSDriver = (values: StoragePoolFormValues) => {
  return values.driver === cephFSDriver;
};

export const hasSource = (
  driver: string,
  hasRemoteDropSource: boolean,
): boolean => {
  const driversWithSource = [btrfsDriver, dirDriver, lvmDriver, lvmClusterDriver, zfsDriver];

  if (hasRemoteDropSource) {
    driversWithSource.push(cephDriver);
    driversWithSource.push(cephFSDriver);
  }

  return driversWithSource.includes(driver);
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

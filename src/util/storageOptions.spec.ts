import {
  btrfsDriver,
  cephDriver,
  cephFSDriver,
  cephObject,
  dirDriver,
  isBucketCompatibleDriver,
  lvmDriver,
  zfsDriver,
} from "./storageOptions";

describe("isBucketCompatibleDriver", () => {
  it("accepts the ceph object driver", () => {
    expect(isBucketCompatibleDriver(cephObject)).toBe(true);
  });

  it("accepts local bucket drivers", () => {
    for (const driver of [dirDriver, btrfsDriver, lvmDriver, zfsDriver]) {
      expect(isBucketCompatibleDriver(driver)).toBe(true);
    }
  });

  it("rejects drivers without bucket support", () => {
    for (const driver of [cephDriver, cephFSDriver, ""]) {
      expect(isBucketCompatibleDriver(driver)).toBe(false);
    }
  });
});

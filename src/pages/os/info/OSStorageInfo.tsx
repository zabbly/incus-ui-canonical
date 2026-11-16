import type { FC } from "react";
import {
  OSInfoList,
  OSInfoSection,
  OSInfoTable,
  lines,
  yesNo,
} from "pages/os/info/OSInfoView";
import type { IncusOSStorage } from "types/os";
import { humanFileSize } from "util/helpers";

const size = (bytes?: number) => humanFileSize(bytes ?? 0, 2);

interface Props {
  data: IncusOSStorage;
}

const OSStorageInfo: FC<Props> = ({ data }) => {
  const root = data.state?.root_partition;
  const drives = data.state?.drives ?? [];
  const pools = data.config?.pools ?? [];

  return (
    <>
      <OSInfoSection title="Root partition">
        <OSInfoList
          items={[
            ["Size", size(root?.size_in_bytes)],
            ["Available", size(root?.available_in_bytes)],
          ]}
        />
      </OSInfoSection>
      <OSInfoSection title="Drives">
        <OSInfoTable
          headers={[
            "ID",
            "Model",
            "Serial",
            "Bus",
            "Capacity",
            "Boot",
            "Encrypted",
            "Member pool",
          ]}
          rows={drives.map((drive) => [
            drive.id,
            drive.model_name,
            drive.serial_number,
            drive.bus,
            size(drive.capacity_in_bytes),
            yesNo(drive.boot),
            yesNo(drive.encrypted),
            drive.member_pool,
          ])}
          emptyMessage="No drives found"
        />
      </OSInfoSection>
      {pools.length > 0 && (
        <OSInfoSection title="Pools">
          <OSInfoTable
            headers={[
              "Name",
              "Type",
              "State",
              "Encryption key",
              "Raw size",
              "Usable size",
              "Allocated",
              "Devices",
            ]}
            rows={pools.map((pool) => [
              pool.name,
              pool.type,
              pool.state,
              pool.encryption_key_status,
              size(pool.raw_pool_size_in_bytes),
              size(pool.usable_pool_size_in_bytes),
              size(pool.pool_allocated_space_in_bytes),
              lines(pool.devices),
            ])}
          />
        </OSInfoSection>
      )}
    </>
  );
};

export default OSStorageInfo;

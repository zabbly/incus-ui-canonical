import type { FC } from "react";
import { Spinner, useNotify } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchDebugLVM } from "api/os";
import NotificationRow from "components/NotificationRow";
import OSInfoView, {
  OSInfoSection,
  OSInfoTable,
} from "pages/os/info/OSInfoView";
import type { IncusOSDebugLVMRow } from "types/os";
import { humanFileSize } from "util/helpers";
import { queryKeys } from "util/queryKeys";

const field = (row: IncusOSDebugLVMRow, key: string): string => {
  const value = row[key];

  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(String).join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
};

// Sizes are reported in bytes.
const size = (row: IncusOSDebugLVMRow, key: string): string => {
  const value = field(row, key);

  return /^\d+$/.test(value) ? humanFileSize(Number(value)) : value;
};

interface Props {
  target: string;
}

const OSDebugLVM: FC<Props> = ({ target }) => {
  const notify = useNotify();

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKeys.osDebugLVM, target],
    queryFn: async () => fetchDebugLVM(target),
  });

  if (error) {
    notify.failure("Loading LVM details failed", error);
  }

  return (
    <>
      <NotificationRow />
      {isLoading && (
        <Spinner className="u-loader" text="Loading LVM details..." />
      )}
      {!isLoading && !error && data && (
        <OSInfoView yamlData={data}>
          <OSInfoSection title="Physical volumes">
            <OSInfoTable
              headers={[
                "Name",
                "Volume group",
                "Size",
                "Free",
                "Attributes",
                "UUID",
              ]}
              rows={(data.pvs ?? []).map((pv) => [
                field(pv, "pv_name"),
                field(pv, "vg_name"),
                size(pv, "pv_size"),
                size(pv, "pv_free"),
                field(pv, "pv_attr"),
                field(pv, "pv_uuid"),
              ])}
            />
          </OSInfoSection>
          <OSInfoSection title="Volume groups">
            <OSInfoTable
              headers={[
                "Name",
                "Size",
                "Free",
                "PVs",
                "LVs",
                "Lock type",
                "System ID",
                "Attributes",
                "UUID",
              ]}
              rows={(data.vgs ?? []).map((vg) => [
                field(vg, "vg_name"),
                size(vg, "vg_size"),
                size(vg, "vg_free"),
                field(vg, "pv_count"),
                field(vg, "lv_count"),
                field(vg, "vg_lock_type"),
                field(vg, "vg_systemid"),
                field(vg, "vg_attr"),
                field(vg, "vg_uuid"),
              ])}
            />
          </OSInfoSection>
          <OSInfoSection title="Logical volumes">
            <OSInfoTable
              headers={[
                "Name",
                "Volume group",
                "Size",
                "Layout",
                "Pool",
                "Origin",
                "Attributes",
                "UUID",
              ]}
              rows={(data.lvs ?? []).map((lv) => [
                field(lv, "lv_name"),
                field(lv, "vg_name"),
                size(lv, "lv_size"),
                field(lv, "lv_layout"),
                field(lv, "pool_lv"),
                field(lv, "origin"),
                field(lv, "lv_attr"),
                field(lv, "lv_uuid"),
              ])}
            />
          </OSInfoSection>
        </OSInfoView>
      )}
    </>
  );
};

export default OSDebugLVM;

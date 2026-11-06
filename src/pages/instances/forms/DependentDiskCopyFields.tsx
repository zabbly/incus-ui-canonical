import type { FC } from "react";
import { Input } from "@canonical/react-components";
import StoragePoolSelector from "pages/storage/StoragePoolSelector";
import { getVolumeName, type DependentDisk } from "util/dependentDisks";

interface Props {
  disks: DependentDisk[];
  pools: Record<string, string>;
  names: Record<string, string>;
  errors: Record<string, string | undefined>;
  setPool: (disk: string, pool: string) => void;
  setName: (disk: string, name: string) => void;
}

// Target pool and volume name for each dependent volume of an instance being copied.
const DependentDiskCopyFields: FC<Props> = ({
  disks,
  pools,
  names,
  errors,
  setPool,
  setName,
}) => {
  if (disks.length === 0) {
    return null;
  }

  return (
    <div className="copy-dependent-disks">
      <p className="u-no-margin--bottom">Dependent volumes</p>
      {disks.map((disk) => (
        <div key={disk.name} className="copy-dependent-disk">
          <p className="u-no-margin--bottom">
            <b>{disk.name}</b>: volume{" "}
            <b>{getVolumeName(disk.device.source)}</b> in pool{" "}
            <b>{disk.device.pool}</b>
          </p>
          <div className="copy-dependent-disk-fields">
            <StoragePoolSelector
              value={pools[disk.name] ?? ""}
              setValue={(value) => {
                setPool(disk.name, value);
              }}
              selectProps={{
                id: `dependent-disk-pool-${disk.name}`,
                label: "Storage pool",
              }}
            />
            <Input
              id={`dependent-disk-name-${disk.name}`}
              type="text"
              label="Volume name"
              value={names[disk.name] ?? ""}
              onChange={(e) => {
                setName(disk.name, e.target.value);
              }}
              error={errors[disk.name]}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default DependentDiskCopyFields;

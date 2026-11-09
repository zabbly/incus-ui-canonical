import type { FC } from "react";
import StoragePoolSelector from "pages/storage/StoragePoolSelector";
import { getVolumeName, type DependentDisk } from "util/dependentDisks";

interface Props {
  disks: DependentDisk[];
  pools: Record<string, string>;
  setPool: (disk: string, pool: string) => void;
}

// Target pool selection for the dependent volumes of an instance being moved to another pool.
const DependentDiskPoolMigration: FC<Props> = ({ disks, pools, setPool }) => {
  if (disks.length === 0) {
    return null;
  }

  return (
    <div className="migrate-dependent-disks">
      {disks.map((disk) => (
        <div key={disk.name} className="migrate-dependent-disk">
          <StoragePoolSelector
            value={pools[disk.name] ?? ""}
            setValue={(value) => {
              setPool(disk.name, value);
            }}
            selectProps={{
              id: `dependent-disk-pool-${disk.name}`,
              label: (
                <>
                  <b>{disk.name}</b> volume{" "}
                  <b>{getVolumeName(disk.device.source)}</b> (currently in{" "}
                  <b>{disk.device.pool}</b>)
                </>
              ),
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default DependentDiskPoolMigration;

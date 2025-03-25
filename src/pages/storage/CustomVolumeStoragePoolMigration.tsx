import { FC } from "react";
import { ActionButton, Button } from "@canonical/react-components";
import StoragePoolSelectTable from "../storage/StoragePoolSelectTable";
import { LxdStorageVolume } from "types/storage";

interface Props {
  storageVolume: LxdStorageVolume;
  targetPool: string;
  onSelect: (pool: string) => void;
  close: () => void;
  migrate: (
    targetPool: string | undefined,
    targetMember: string | undefined,
  ) => void;
}

const CustomVolumeStoragePoolMigration: FC<Props> = ({
  storageVolume,
  targetPool,
  onSelect,
  close,
  migrate,
}) => {
  const summary = (
    <div className="migrate-instance-summary">
      <p>
        This will migrate the storage volume{" "}
        <strong>{storageVolume.name}</strong> to pool <b>{targetPool}</b>.
      </p>
    </div>
  );

  return (
    <>
      {targetPool && summary}
      {!targetPool && (
        <StoragePoolSelectTable
          onSelect={onSelect}
          disablePool={{
            name: storageVolume.pool,
            reason: "Storage volume already in this pool",
          }}
        />
      )}
      {targetPool && (
        <footer id="migrate-instance-actions" className="p-modal__footer">
          <Button
            className="u-no-margin--bottom"
            type="button"
            aria-label="cancel migrate"
            appearance="base"
            onClick={close}
          >
            Cancel
          </Button>
          <ActionButton
            appearance="positive"
            className="u-no-margin--bottom"
            onClick={() => migrate(targetPool, undefined)}
            disabled={!targetPool}
          >
            Migrate
          </ActionButton>
        </footer>
      )}
    </>
  );
};

export default CustomVolumeStoragePoolMigration;

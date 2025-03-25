import { FC } from "react";
import { ActionButton, Button } from "@canonical/react-components";
import { LxdStorageVolume } from "types/storage";
import ClusterMemberSelectTable from "../cluster/ClusterMemberSelectTable";

interface Props {
  storageVolume: LxdStorageVolume;
  targetMember: string;
  migrate: (
    targetPool: string | undefined,
    targetMember: string | undefined,
  ) => void;
  close: () => void;
  onSelect: (value: string) => void;
}

const CustomVolumeClusterMemberMigration: FC<Props> = ({
  storageVolume,
  targetMember,
  migrate,
  close,
  onSelect,
}) => {
  const summary = (
    <div className="migrate-instance-summary">
      <p>
        This will migrate custom volume <strong>{storageVolume.name}</strong> to
        cluster member <b>{targetMember}</b>.
      </p>
    </div>
  );

  return (
    <>
      {targetMember && summary}
      {!targetMember && (
        <ClusterMemberSelectTable
          onSelect={onSelect}
          disableMember={{
            name: storageVolume.location,
            reason: "Custom volume already on this member",
          }}
        />
      )}
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
          onClick={() => migrate(undefined, targetMember)}
          disabled={!targetMember}
        >
          Migrate
        </ActionButton>
      </footer>
    </>
  );
};

export default CustomVolumeClusterMemberMigration;

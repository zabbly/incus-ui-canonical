import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon } from "@canonical/react-components";
import type { LxdInstance } from "types/instance";
import { ROOT_PATH } from "util/rootPath";
import { useInstanceEntitlements } from "util/entitlements/instances";

interface Props {
  instance: LxdInstance;
}

const EditInstanceBtn: FC<Props> = ({ instance }) => {
  const navigate = useNavigate();
  const { canEditInstance } = useInstanceEntitlements();
  const canEdit = canEditInstance(instance);

  const handleOpen = () => {
    navigate(
      `${ROOT_PATH}/ui/project/${encodeURIComponent(instance.project)}/instance/${encodeURIComponent(instance.name)}/configuration`,
    );
  };

  return (
    <Button
      appearance="base"
      dense
      hasIcon
      onClick={handleOpen}
      disabled={!canEdit}
      title={
        canEdit
          ? "Edit configuration"
          : "You do not have permission to edit this instance"
      }
      aria-label="Edit configuration"
    >
      <Icon name="edit" />
    </Button>
  );
};

export default EditInstanceBtn;

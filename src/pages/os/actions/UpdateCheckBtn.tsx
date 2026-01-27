import type { FC } from "react";
import {
  ActionButton,
  Icon,
  useToastNotification,
} from "@canonical/react-components";
import { updateCheck } from "api/os";

interface Props {
  target: string;
}

const UpdateCheckBtn: FC<Props> = ({ target }) => {
  const toastNotify = useToastNotification();

  const handleUpdateCheck = () => {
    updateCheck(target)
      .then(() => {
        toastNotify.success(<>Update check</>);
      })
      .catch((e) => {
        toastNotify.failure("Update check failed", e);
      });
  };

  return (
    <ActionButton
      appearance="base"
      className="has-icon is-dense"
      onClick={handleUpdateCheck}
      title="Update check"
    >
      <Icon name="export" />
    </ActionButton>
  );
};

export default UpdateCheckBtn;

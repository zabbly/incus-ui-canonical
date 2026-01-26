import type { FC } from "react";
import {
  ConfirmationButton,
  Icon,
  useToastNotification,
} from "@canonical/react-components";
import { rebootOS } from "api/os";

interface Props {
  target: string;
}

const RebootOSBtn: FC<Props> = ({ target }) => {
  const toastNotify = useToastNotification();

  const handleReboot = () => {
    rebootOS(target)
      .then(() => {
        toastNotify.success(<>OS rebooted.</>);
      })
      .catch((e) => {
        toastNotify.failure("OS reboot failed", e);
      });
  };

  return (
    <ConfirmationButton
      appearance="base"
      loading={false}
      className="has-icon is-dense"
      confirmationModalProps={{
        title: "Confirm reboot",
        children: <p>This will reboot server</p>,
        onConfirm: handleReboot,
        confirmButtonLabel: "Reboot",
      }}
      shiftClickEnabled
      showShiftClickHint
    >
      <Icon name="restart" />
    </ConfirmationButton>
  );
};

export default RebootOSBtn;

import type { FC } from "react";
import {
  ConfirmationButton,
  Icon,
  useToastNotification,
} from "@canonical/react-components";
import { poweroffOS } from "api/os";

interface Props {
  target: string;
}

const ShutdownOSBtn: FC<Props> = ({ target }) => {
  const toastNotify = useToastNotification();

  const handlePoweroff = () => {
    poweroffOS(target)
      .then(() => {
        toastNotify.success(<>OS shutdown</>);
      })
      .catch((e) => {
        toastNotify.failure("OS poweroff failed", e);
      });
  };

  return (
    <ConfirmationButton
      appearance="base"
      className="has-icon is-dense"
      confirmationModalProps={{
        title: "Confirm shutdown",
        children: <p>This will shutdown server</p>,
        onConfirm: handlePoweroff,
        confirmButtonLabel: "Poweroff",
      }}
      shiftClickEnabled
      showShiftClickHint
    >
      <Icon name="stop" />
    </ConfirmationButton>
  );
};

export default ShutdownOSBtn;

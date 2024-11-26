import { FC } from "react";
import { Button, Icon } from "@canonical/react-components";
import usePortal from "react-useportal";
import { LxdInstance } from "types/instance";
import { useInstanceLoading } from "context/instanceLoading";
import MigrateInstanceModal from "../MigrateInstanceModal";
import classNames from "classnames";

interface Props {
  instance: LxdInstance;
  project: string;
  classname?: string;
  onClose?: () => void;
}

const MigrateInstanceBtn: FC<Props> = ({ instance, classname }) => {
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const instanceLoading = useInstanceLoading();
  const isLoading =
    instanceLoading.getType(instance) === "Migrating" ||
    instance.status === "Migrating";

  const isDisabled = isLoading || !!instanceLoading.getType(instance);

  return (
    <>
      {isOpen && (
        <Portal>
          <MigrateInstanceModal close={closePortal} instance={instance} />
        </Portal>
      )}
      <Button
        appearance="base"
        loading={isLoading}
        className="has-icon is-dense"
        onClick={openPortal}
        disabled={isDisabled}
        title="Migrate instance"
      >
        <Icon name="machines" />
      </Button>
    </>
  );
};

export default MigrateInstanceBtn;

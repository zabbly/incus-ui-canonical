import type { FC } from "react";
import { Button, Icon, usePortal } from "@canonical/react-components";
import type { LxdInstance } from "types/instance";
import { useInstanceLoading } from "context/instanceLoading";
import MigrateInstanceModal from "../MigrateInstanceModal";
import classNames from "classnames";
import { useInstanceEntitlements } from "util/entitlements/instances";

interface Props {
  instance: LxdInstance;
  classname?: string;
  onClose?: () => void;
}

const MigrateInstanceBtn: FC<Props> = ({ instance, classname }) => {
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const { canEditInstance } = useInstanceEntitlements();
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
        disabled={isDisabled || !canEditInstance(instance) || isLoading}
        title={
          canEditInstance()
            ? "Migrate instance"
            : "You do not have permission to migrate this instance"
        }
      >
        <Icon name="machines" />
      </Button>
    </>
  );
};

export default MigrateInstanceBtn;

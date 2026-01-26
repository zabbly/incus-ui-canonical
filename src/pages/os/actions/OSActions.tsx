import type { FC } from "react";
import classnames from "classnames";
import { List } from "@canonical/react-components";
import UpdateCheckBtn from "pages/os/actions/UpdateCheckBtn";
import RebootOSBtn from "pages/os/actions/RebootOSBtn";
import ShutdownOSBtn from "pages/os/actions/ShutdownOSBtn";

interface Props {
  className?: string;
  target: string;
}

const OSActions: FC<Props> = ({ className, target }) => {
  const items = [
    <UpdateCheckBtn target={target} key="update-check" />,
    <RebootOSBtn target={target} key="reboot" />,
    <ShutdownOSBtn target={target} key="shutdown" />,
  ];

  return (
    <List
      inline
      className={classnames(className, "actions-list")}
      items={items}
    />
  );
};

export default OSActions;

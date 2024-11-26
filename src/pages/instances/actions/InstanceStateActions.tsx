import { FC } from "react";
import { LxdInstance } from "types/instance";
import StartInstanceBtn from "pages/instances/actions/StartInstanceBtn";
import StopInstanceBtn from "pages/instances/actions/StopInstanceBtn";
import FreezeInstanceBtn from "pages/instances/actions/FreezeInstanceBtn";
import RestartInstanceBtn from "pages/instances/actions/RestartInstanceBtn";
import MigrateInstanceBtn from "pages/instances/actions/MigrateInstanceBtn";
import classnames from "classnames";
import { List } from "@canonical/react-components";
import { useSettings } from "context/useSettings";
import { isClusteredServer } from "util/settings";

interface Props {
  instance: LxdInstance;
  className?: string;
}

const InstanceStateActions: FC<Props> = ({ instance, className }) => {
  const { data: settings } = useSettings();
  const isClustered = isClusteredServer(settings);
  const items = [
    <StartInstanceBtn key="start" instance={instance} />,
    <RestartInstanceBtn key="restart" instance={instance} />,
    <FreezeInstanceBtn key="freeze" instance={instance} />,
    <StopInstanceBtn key="stop" instance={instance} />,
  ];

  if (isClustered) {
    items.push(<MigrateInstanceBtn key="migrate" instance={instance} />)
  }

  return (
    <List
      inline
      className={classnames(className, "actions-list")}
      items={items}
    />
  );
};

export default InstanceStateActions;

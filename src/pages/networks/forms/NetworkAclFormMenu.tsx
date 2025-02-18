import { FC, useEffect } from "react";
import MenuItem from "components/forms/FormMenuItem";
import { useNotify } from "@canonical/react-components";
import { updateMaxHeight } from "util/updateMaxHeight";
import useEventListener from "util/useEventListener";

export const MAIN_CONFIGURATION = "Main configuration";
export const YAML_CONFIGURATION = "YAML configuration";

interface Props {
  active: string;
  setActive: (val: string) => void;
}

const NetworkAclFormMenu: FC<Props> = ({ active, setActive }) => {
  const notify = useNotify();
  const menuItemProps = {
    active,
    setActive,
  };

  const resize = () => {
    updateMaxHeight("form-navigation", "p-bottom-controls");
  };
  useEffect(resize, [notify.notification?.message]);
  useEventListener("resize", resize);
  return (
    <div className="p-side-navigation--accordion form-navigation">
      <nav aria-label="Network form navigation">
        <ul className="p-side-navigation__list">
          <MenuItem label={MAIN_CONFIGURATION} {...menuItemProps} />
        </ul>
      </nav>
    </div>
  );
};

export default NetworkAclFormMenu;

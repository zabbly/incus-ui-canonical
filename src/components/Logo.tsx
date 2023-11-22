import type { FC } from "react";
import { useCurrentProject } from "context/useCurrentProject";
import { NavLink } from "react-router-dom";
import { useSettings } from "context/useSettings";
import classNames from "classnames";
import { ROOT_PATH } from "util/rootPath";

interface Props {
  light?: boolean;
}

const Logo: FC<Props> = ({ light }) => {
  const { project, isLoading } = useCurrentProject();
  const { data: settings } = useSettings();

  const src = `${ROOT_PATH}/ui/assets/img/incus-logo.svg`;
  const heading = "Incus UI";

  const getLogoLink = () => {
    if (isLoading || !project) {
      return `${ROOT_PATH}/ui/`;
    }
    return `${ROOT_PATH}/ui/project/${encodeURIComponent(project.name)}`;
  };

  return (
    <NavLink className="p-panel__logo" to={getLogoLink()}>
      <img src={src} alt="Incus UI logo" className="p-panel__logo-image" />
      <div
        className={classNames("logo-text p-heading--4", { "is-light": light })}
      >
        {heading}
      </div>
    </NavLink>
  );
};

export default Logo;

import { FC } from "react";
import { useProject } from "context/project";
import { NavLink } from "react-router-dom";
import { useSettings } from "context/useSettings";

const Logo: FC = () => {
  const { project, isLoading } = useProject();
  const { data: settings } = useSettings();

  const src = "/ui/assets/img/incus-logo.svg";
  const heading = "Incus UI";

  const getLogoLink = () => {
    if (isLoading || !project) {
      return "/ui/";
    }
    return `/ui/project/${project.name}`;
  };

  return (
    <NavLink className="p-panel__logo" to={getLogoLink()}>
      <img src={src} alt="Incus UI logo" className="p-panel__logo-image" />
      <div className="logo-text p-heading--4">{heading}</div>
    </NavLink>
  );
};

export default Logo;

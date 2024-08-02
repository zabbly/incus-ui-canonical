import { useEffect } from "react";
import { useSettings } from "context/useSettings";

export const setTitle = (): void => {
  const { data: settings } = useSettings();

  useEffect(() => {
    const host = settings?.config?.["user.ui.title"] ?? location.hostname;
    document.title = `${host} | Incus UI`;
  }, [settings?.config]);
};

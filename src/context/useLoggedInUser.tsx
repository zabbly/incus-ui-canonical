import { useSettings } from "./useSettings";

export const useLoggedInUser = () => {
  const { data: settings } = useSettings();

  const id = settings?.auth_user_name || "";
  const authMethod = settings?.auth_user_method || "";

  return {
    loggedInUserName: id,
    loggedInUserID: id,
    authMethod,
  };
};

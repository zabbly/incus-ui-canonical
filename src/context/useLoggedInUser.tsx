import { useSettings } from "./useSettings";

export const useLoggedInUser = () => {
  const { data: settings } = useSettings();

  const id = settings?.auth_user_name || "";

  return {
    loggedInUserName: id,
    loggedInUserID: id,
  };
};

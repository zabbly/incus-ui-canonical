import { ROOT_PATH } from "util/rootPath";

// sessionStorage survives the full page reloads of the OIDC and TLS login flows
const SESSION_STORAGE_KEY = "incusLoginRedirect";

const isRestorablePath = (pathname: string): boolean =>
  pathname.startsWith(`${ROOT_PATH}/ui/`) &&
  !pathname.startsWith(`${ROOT_PATH}/ui/login`);

export const saveLoginRedirect = (): void => {
  const { pathname, search, hash } = window.location;
  if (!isRestorablePath(pathname)) {
    return;
  }
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, `${pathname}${search}${hash}`);
  } catch {
    // storage unavailable, fall back to the default landing page
  }
};

export const loadLoginRedirect = (): string | null => {
  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return saved && isRestorablePath(saved) ? saved : null;
  } catch {
    return null;
  }
};

export const clearLoginRedirect = (): void => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
};

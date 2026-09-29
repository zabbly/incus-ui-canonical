import type { LxdInstance } from "types/instance";

// A running container can't be moved statelessly to another cluster member.
// With refresh, the server shuts it down, moves it and starts it on the
// target (near-live migration). Only valid for a member change alone. A
// target of "none" is no target, as in addTarget.
export const isNearLiveMigration = (
  instance: LxdInstance,
  hasInstanceRefreshMigration: boolean,
  target?: string,
  pool?: string,
  targetProject?: string,
): boolean =>
  hasInstanceRefreshMigration &&
  instance.type === "container" &&
  instance.status === "Running" &&
  !!target &&
  target !== "none" &&
  target !== instance.location &&
  !pool &&
  !targetProject;

import type { LxdConfigPair } from "types/config";

export type ProjectReplicaMode = "leader" | "standby" | "";

export interface ProjectStateResource {
  limit: number;
  usage: number;
}

export interface ProjectState {
  resources: Record<string, ProjectStateResource>;
}

export interface LxdProject {
  name: string;
  config: LxdConfigPair;
  description: string;
  used_by?: string[];
  etag?: string;
  access_entitlements?: string[];
  replica_mode?: ProjectReplicaMode;
}

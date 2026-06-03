import type { LxdConfigPair } from "types/config";

export interface ProjectStateResource {
  Limit: number;
  Usage: number;
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
}

import { LxdConfigPair } from "./config";
import { LxdDevices } from "./device";

interface LxdInstanceCPUUsage {
  usage: number;
}

interface LxdInstanceDiskUsage {
  usage: number;
  total: number;
}

interface LxdInstanceMemory {
  swap_usage: number;
  swap_usage_peak: number;
  usage: number;
  usage_peak: number;
  total: number;
}

interface LxdInstanceNetworkAddress {
  address: string;
  family: string;
  netmask: string;
  scope: string;
}

interface LxdInstanceNetworkCounters {
  bytes_received: number;
  bytes_sent: number;
  errors_received: number;
  errors_sent: number;
  packets_dropped_inbound: number;
  packets_dropped_outbound: number;
  packets_received: number;
  packets_sent: number;
}

interface LxdInstanceNetwork {
  addresses: LxdInstanceNetworkAddress[];
  counters: LxdInstanceNetworkCounters;
  host_name: string;
  hwaddr: string;
  mtu: number;
  state: "up" | "down";
  type: string;
}

interface LxdInstanceState {
  cpu: LxdInstanceCPUUsage;
  disk: {
    root: LxdInstanceDiskUsage;
  } & Record<string, LxdInstanceDiskUsage>;
  memory: LxdInstanceMemory;
  network?: Record<string, LxdInstanceNetwork>;
  pid: number;
  processes: number;
  status: string;
  etag?: string;
}

interface LxdInstanceSnapshot {
  name: string;
  created_at: string;
  expires_at: string;
  stateful: boolean;
  ephemeral: boolean;
  config: {
    "volatile.base_image"?: string;
  };
}

export type LxdInstanceAction =
  | "freeze"
  | "restart"
  | "start"
  | "stop"
  | "unfreeze";

export type LxdInstanceStatus =
  | "Error"
  | "Freezing"
  | "Frozen"
  | "Restarting"
  | "Running"
  | "Starting"
  | "Stopped"
  | "Stopping"
  | "Migrating";

export interface LxdInstance {
  architecture: string;
  config: {
    "image.description"?: string;
  } & LxdConfigPair;
  created_at: string;
  description: string;
  devices: LxdDevices;
  ephemeral: boolean;
  expanded_config: LxdConfigPair;
  expanded_devices?: LxdDevices;
  last_used_at: string;
  location: string;
  name: string;
  profiles: string[];
  project: string;
  restore?: string;
  snapshots: LxdInstanceSnapshot[] | null;
  state?: LxdInstanceState;
  stateful: boolean;
  status: LxdInstanceStatus;
  type: "container" | "virtual-machine";
  etag?: string;
}

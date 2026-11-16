export interface IncusOSApplicationState {
  initialized?: boolean;
  friendly_version?: string;
  version?: string;
  available_versions?: string[];
}

export interface IncusOSApplication {
  config: object;
  state: IncusOSApplicationState;
}

export interface IncusOSSettings {
  environment: {
    hostname: string;
    os_name: string;
    os_version?: string;
    uptime?: number | string;
  };
}

export interface IncusOSSystemUpdateState {
  last_check: string;
  status: string;
  needs_reboot: boolean;
}

export interface IncusOSSystemUpdate {
  state: IncusOSSystemUpdateState;
}

export interface IncusOSLog {
  _COMM: string;
  _HOSTNAME: string;
  _PID: string;
  __REALTIME_TIMESTAMP: string;
  __SYSLOG_IDENTIFIER: string;
  MESSAGE: string | number[];
  SYSLOG_IDENTIFIER: string;
}

export interface IncusOSConfig {
  state: object;
  config: object;
}

export interface IncusOSNetworkInterfaceState {
  addresses?: string[];
  hwaddr?: string;
  mtu?: number;
  roles?: string[];
  speed?: string;
  state?: string;
  type?: string;
}

export interface IncusOSNetwork {
  config?: object;
  state?: {
    configuration_in_process?: boolean;
    interfaces?: Record<string, IncusOSNetworkInterfaceState>;
  };
}

export interface IncusOSZramSwap {
  disk_size?: number;
  // Current API spelling.
  incompressed_size?: number;
  uncompressed_size?: number;
  compressed_size?: number;
  compression_ratio?: number;
  total_memory_use?: number;
}

export interface IncusOSKernel {
  config?: object;
  state?: {
    memory?: {
      zram_swap?: IncusOSZramSwap;
    };
  };
}

export interface IncusOSStorageDrive {
  id: string;
  model_name?: string;
  serial_number?: string;
  bus?: string;
  capacity_in_bytes?: number;
  boot?: boolean;
  encrypted?: boolean;
  member_pool?: string;
}

export interface IncusOSStoragePool {
  name: string;
  type?: string;
  state?: string;
  encryption_key_status?: string;
  raw_pool_size_in_bytes?: number;
  usable_pool_size_in_bytes?: number;
  pool_allocated_space_in_bytes?: number;
  devices?: string[];
}

export interface IncusOSStorage {
  config?: {
    pools?: IncusOSStoragePool[];
  };
  state?: {
    drives?: IncusOSStorageDrive[];
    root_partition?: {
      size_in_bytes?: number;
      available_in_bytes?: number;
    };
  };
}

export interface IncusOSSecurity {
  config?: object;
  state?: {
    encryption_recovery_keys_retrieved?: boolean;
    secure_boot_enabled?: boolean;
    tpm_status?: string;
  };
}

export interface IncusOSLicense {
  name: string;
  type: string;
  content: string;
}

export interface IncusOSDebugKernelModule {
  name: string;
  dependencies?: string[] | null;
  in_use?: boolean;
}

export interface IncusOSDebugKernel {
  version?: string;
  architecture?: string;
  cpu_baseline?: string;
  modules?: IncusOSDebugKernelModule[] | null;
}

export type IncusOSDebugLVMRow = Record<string, unknown>;

export interface IncusOSDebugLVM {
  pvs?: IncusOSDebugLVMRow[] | null;
  vgs?: IncusOSDebugLVMRow[] | null;
  lvs?: IncusOSDebugLVMRow[] | null;
}

export interface IncusOSDebugReportMetric {
  name: string;
  object?: string;
  fields?: Record<string, unknown>;
  value?: unknown;
}

export interface IncusOSDebugReport {
  media_type?: string;
  timestamp?: string;
  metrics?: IncusOSDebugReportMetric[] | null;
}

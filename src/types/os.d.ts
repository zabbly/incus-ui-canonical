export interface IncusOSApplication {
  config: object;
  state: object;
}

export interface IncusOSSettings {
  environment: {
    hostname: string;
    os_name: string;
    os_version?: string;
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
  MESSAGE: string;
  SYSLOG_IDENTIFIER: string;
}

export interface IncusOSConfig {
  state: object;
  config: object;
}

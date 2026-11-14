import type { LxdApiResponse } from "types/apiResponse";
import type {
  IncusOSApplication,
  IncusOSConfig,
  IncusOSLog,
  IncusOSSettings,
  IncusOSSystemUpdate,
} from "types/os";
import { handleResponse } from "util/helpers";

export interface DebugLogOptions {
  unit?: string;
  boot?: string;
  entries?: number;
  since?: string;
  until?: string;
}

const prepareOSURL = (
  url: string,
  target: string,
  params: Record<string, string> = {},
) => {
  const query = new URLSearchParams();

  if (target) {
    query.set("target", target);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const search = query.toString();

  return search ? `${url}?${search}` : url;
};

export const isIncusOS = async (): Promise<boolean> => {
  return fetch("/os/1.0")
    .then(handleResponse)
    .then((response: LxdApiResponse<null>) => {
      if (response.error_code == 0) {
        return true;
      }
      return false;
    });
};

export const fetchOS = async (target: string): Promise<IncusOSSettings> => {
  return fetch(prepareOSURL("/os/1.0", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<IncusOSSettings>) => {
      return data.metadata;
    });
};

export const fetchOSApplications = async (
  target: string,
): Promise<string[]> => {
  return fetch(prepareOSURL("/os/1.0/applications", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string[]>) => {
      return data.metadata;
    });
};

export const fetchOSApplication = async (
  name: string,
  target: string,
): Promise<IncusOSApplication> => {
  return fetch(prepareOSURL(name, target))
    .then(handleResponse)
    .then((data: LxdApiResponse<IncusOSApplication>) => {
      return data.metadata;
    });
};

export const addOSApplication = async (
  name: string,
  target: string,
): Promise<void> => {
  await fetch(prepareOSURL("/os/1.0/applications", target), {
    method: "POST",
    body: JSON.stringify({ name: name }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(handleResponse);
};

export const fetchSystemUpdate = async (
  target: string,
): Promise<IncusOSSystemUpdate> => {
  return fetch(prepareOSURL("/os/1.0/system/update", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<IncusOSSystemUpdate>) => {
      return data.metadata;
    });
};

export const fetchDebugLogs = async (
  target: string,
  options: DebugLogOptions,
): Promise<IncusOSLog[]> => {
  const url = new URL("/os/1.0/debug/log", window.location.origin);

  if (target) {
    url.searchParams.set("target", target);
  }

  if (options.entries && options.entries > 0) {
    url.searchParams.set("entries", options.entries.toString());
  }

  if (options.unit) {
    url.searchParams.set("unit", options.unit);
  }

  if (options.boot) {
    url.searchParams.set("boot", options.boot);
  }

  if (options.since) {
    url.searchParams.set("since", options.since);
  }

  if (options.until) {
    url.searchParams.set("until", options.until);
  }

  return fetch(url.pathname + url.search)
    .then(handleResponse)
    .then((data: LxdApiResponse<IncusOSLog[]>) => {
      return data.metadata;
    });
};

export const fetchDebugProcesses = async (target: string): Promise<string> => {
  return fetch(prepareOSURL("/os/1.0/debug/processes", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string>) => {
      return data.metadata;
    });
};

export const fetchOSServices = async (target: string): Promise<string[]> => {
  return fetch(prepareOSURL("/os/1.0/services", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string[]>) => {
      return data.metadata;
    });
};

export const fetchOSService = async (
  name: string,
  target: string,
): Promise<string> => {
  return fetch(prepareOSURL(`/os/1.0/services/${name}`, target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string>) => {
      return data.metadata;
    });
};

export const updateOSService = async (
  name: string,
  config: string,
  target: string,
): Promise<void> => {
  await fetch(prepareOSURL(`/os/1.0/services/${name}`, target), {
    method: "PUT",
    body: config,
    headers: {
      "Content-Type": "application/json",
    },
  }).then(handleResponse);
};

// Fetch a config section (returns the {state, config} object).
export const fetchOSSection = async (
  endpoint: string,
  target: string,
): Promise<IncusOSConfig> => {
  return fetch(prepareOSURL(`/os/1.0/${endpoint}`, target))
    .then(handleResponse)
    .then((data: LxdApiResponse<IncusOSConfig>) => {
      return data.metadata;
    });
};

// Update the config of a section.
export const updateOSSection = async (
  endpoint: string,
  config: object,
  target: string,
): Promise<void> => {
  await fetch(prepareOSURL(`/os/1.0/${endpoint}`, target), {
    method: "PUT",
    body: JSON.stringify({ config: config }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(handleResponse);
};

// Run an action (POST /os/1.0/<endpoint>/:<action>).
export const runOSAction = async (
  endpoint: string,
  action: string,
  target: string,
  data?: object,
): Promise<void> => {
  await fetch(prepareOSURL(`/os/1.0/${endpoint}/:${action}`, target), {
    method: "POST",
    body: data === undefined ? undefined : JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(handleResponse);
};

// Run an action returning a file, resolving to an object URL.
export const runOSActionDownload = async (
  endpoint: string,
  action: string,
  target: string,
  data?: object,
): Promise<string> => {
  return fetch(prepareOSURL(`/os/1.0/${endpoint}/:${action}`, target), {
    method: "POST",
    body: data === undefined ? undefined : JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const result = (await response.json()) as { error: string };
        throw new Error(result.error);
      }

      return response.blob();
    })
    .then((blob) => URL.createObjectURL(blob));
};

// Run an action taking a file as input.
export const runOSActionUpload = async (
  endpoint: string,
  action: string,
  file: File,
  target: string,
  params: Record<string, string> = {},
): Promise<void> => {
  await fetch(prepareOSURL(`/os/1.0/${endpoint}/:${action}`, target, params), {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
    },
  }).then(handleResponse);
};

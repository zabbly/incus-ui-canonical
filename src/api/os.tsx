import type { LxdApiResponse } from "types/apiResponse";
import type {
  IncusOSApplication,
  IncusOSLog,
  IncusOSSettings,
  IncusOSSystemUpdate,
} from "types/os";
import { handleResponse } from "util/helpers";

const prepareOSURL = (url: string, target: string) => {
  let result = url;

  if (target) {
    result += `?target=${target}`;
  }

  return result;
};

export const fetchOS = async (): Promise<IncusOSSettings> => {
  return fetch("/os/1.0")
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

export const fetchSystemUpdate = async (
  target: string,
): Promise<IncusOSSystemUpdate> => {
  return fetch(prepareOSURL("/os/1.0/system/update", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<IncusOSSystemUpdate>) => {
      return data.metadata;
    });
};

export const fetchDebugLogs = async (target: string): Promise<IncusOSLog[]> => {
  return fetch(prepareOSURL("/os/1.0/debug/log", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<IncusOSLog[]>) => {
      return data.metadata;
    });
};

export const fetchOSNetwork = async (target: string): Promise<string> => {
  return fetch(prepareOSURL("/os/1.0/system/network", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string>) => {
      return data.metadata;
    });
};

export const updateOSNetwork = async (
  network: string,
  target: string,
): Promise<void> => {
  await fetch(prepareOSURL("/os/1.0/system/network", target), {
    method: "PUT",
    body: network,
    headers: {
      "Content-Type": "application/json",
    },
  }).then(handleResponse);
};

export const fetchOSStorage = async (target: string): Promise<string> => {
  return fetch(prepareOSURL("/os/1.0/system/storage", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string>) => {
      return data.metadata;
    });
};

export const updateOSStorage = async (
  storage: string,
  target: string,
): Promise<void> => {
  await fetch(prepareOSURL("/os/1.0/system/storage", target), {
    method: "PUT",
    body: storage,
    headers: {
      "Content-Type": "application/json",
    },
  }).then(handleResponse);
};

export const fetchOSSecurity = async (target: string): Promise<string> => {
  return fetch(prepareOSURL("/os/1.0/system/security", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string>) => {
      return data.metadata;
    });
};

export const updateOSSecurity = async (
  security: string,
  target: string,
): Promise<void> => {
  await fetch(prepareOSURL("/os/1.0/system/security", target), {
    method: "PUT",
    body: security,
    headers: {
      "Content-Type": "application/json",
    },
  }).then(handleResponse);
};

export const fetchOSServices = async (target: string): Promise<string[]> => {
  return fetch(prepareOSURL("/os/1.0/services", target))
    .then(handleResponse)
    .then((data: LxdApiResponse<string>) => {
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

export const updateCheck = async (
  target: string,
): Promise<LxdApiResponse<null>> => {
  await fetch(prepareOSURL("/os/1.0/system/update/:check", target), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(handleResponse)
    .then((data: LxdApiResponse<null>) => {
      return data;
    });
};

export const poweroffOS = async (
  target: string,
): Promise<LxdApiResponse<null>> => {
  await fetch(prepareOSURL("/os/1.0/system/:poweroff", target), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(handleResponse)
    .then((data: LxdApiResponse<null>) => {
      return data;
    });
};

export const rebootOS = async (
  target: string,
): Promise<LxdApiResponse<null>> => {
  return fetch(prepareOSURL("/os/1.0/system/:reboot", target), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(handleResponse)
    .then((data: LxdApiResponse<null>) => {
      return data;
    });
};

import { LxdInstance } from "types/instance";
import { Address4, Address6 } from "ip-address";

const matchByIpv4 = (instance: LxdInstance, value: string): boolean =>
  matchByNet(instance, value, "ipv4");
const matchByIpv6 = (instance: LxdInstance, value: string): boolean =>
  matchByNet(instance, value, "ipv6");

const matchByNet = (
  instance: LxdInstance,
  value: string,
  family: string,
): boolean => {
  if (!instance.state) {
    return false;
  }

  if (!instance.state.network) {
    return false;
  }

  for (const iface in instance.state.network) {
    const addresses = instance.state.network[iface]["addresses"];
    for (let i = 0; i < addresses.length; i++) {
      if (family === "ipv6" && addresses[i].family != "inet6") {
        continue;
      }

      if (family === "ipv4" && addresses[i].family != "inet") {
        continue;
      }

      if (addresses[i].address === value) {
        return true;
      }

      if (family === "ipv4") {
        try {
          const subnet = new Address4(value);
          const ip = new Address4(addresses[i].address);
          if (subnet.isCorrect() && ip.isInSubnet(subnet)) {
            return true;
          }
        } catch {
          continue;
        }
      } else {
        try {
          const subnet = new Address6(value);
          const ip = new Address6(addresses[i].address);
          if (subnet.isCorrect() && ip.isInSubnet(subnet)) {
            return true;
          }
        } catch {
          continue;
        }
      }
    }
  }

  return false;
};

const shorthandFunctions: Record<
  string,
  (instance: LxdInstance, value: string) => boolean
> = {
  type: (instance: LxdInstance, value: string) =>
    instance.type.toLowerCase() == value.toLowerCase(),
  state: (instance: LxdInstance, value: string) =>
    instance.status.toLowerCase() == value.toLowerCase(),
  status: (instance: LxdInstance, value: string) =>
    instance.status.toLowerCase() == value.toLowerCase(),
  architecture: (instance: LxdInstance, value: string) =>
    instance.architecture.toLowerCase() == value.toLowerCase(),
  location: (instance: LxdInstance, value: string) =>
    instance.location.toLowerCase() == value.toLowerCase(),
  ipv4: (instance: LxdInstance, value: string) => matchByIpv4(instance, value),
  ipv6: (instance: LxdInstance, value: string) => matchByIpv6(instance, value),
};

const serverSupportedFields: string[] = [
  "architecture",
  "config",
  "created_at",
  "description",
  "devices",
  "ephemeral",
  "expanded_config",
  "expanded_devices",
  "last_used_at",
  "location",
  "name",
  "profiles",
  "project",
  "snapshots",
  "state",
  "stateful",
  "status",
  "type",
];

const evaluateShorthandFilter = (
  key: string,
  value: string,
  instance: LxdInstance,
): boolean => {
  const shorthandDelimiter = ",";

  if (!(key in shorthandFunctions)) {
    return false;
  }

  if (!value.includes(shorthandDelimiter)) {
    return shorthandFunctions[key](instance, value);
  }

  const items = value.split(shorthandDelimiter);
  for (let i = 0; i < items.length; i++) {
    const result = shorthandFunctions[key](instance, items[i]);
    if (result == true) {
      return true;
    }
  }

  return false;
};

const dotPrefixMatch = (shortKey: string, fullKey: string): boolean => {
  const fullMembs = fullKey.split(".");
  const shortMembs = shortKey.split(".");

  if (fullMembs.length != shortMembs.length) {
    return false;
  }

  for (let i = 0; i < fullMembs.length; i++) {
    if (!fullMembs[i].startsWith(shortMembs[i])) {
      return false;
    }
  }

  return true;
};

const evaluateExpandedConfig = (
  key: string,
  value: string,
  instance: LxdInstance,
): boolean => {
  for (const configKey in instance.expanded_config) {
    if (dotPrefixMatch(key, configKey)) {
      if (!(value.includes("^") || value.includes("$"))) {
        value = `^${value}$`;
      }

      try {
        const regex = new RegExp(value, "i");
        if (regex.test(instance.expanded_config[configKey] || "")) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }

  return false;
};

export const showInstance = (
  instance: LxdInstance,
  filters: string[],
): boolean => {
  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i].split("=");
    const key = filter[0];

    if (filter.length == 1) {
      if (key === "") {
        continue;
      }

      let regexpValue = key;
      if (!(regexpValue.includes("^") || regexpValue.includes("$"))) {
        regexpValue = `^${regexpValue}$`;
      }

      try {
        const regex = new RegExp(regexpValue, "i");
        if (regex.test(instance.name)) {
          continue;
        }
      } catch {
        // eslint-disable-next-line no-empty
      }

      if (instance.name.startsWith(key)) {
        continue;
      }

      return false;
    }

    const value = filter[1];

    if (evaluateShorthandFilter(key, value, instance) == true) {
      continue;
    }

    if (evaluateExpandedConfig(key, value, instance) == true) {
      continue;
    }

    return false;
  }

  return true;
};

export const parseFilters = (filtersStr: string): string[] => {
  const decodedFilters = decodeURIComponent(filtersStr).replace(/\+/g, " ");
  return decodedFilters.split(" ");
};

export const encodeServerFilters = (filters: string[]): string => {
  return prepareInstanceServerSideFilters(filters)
    .map((part) => (part.includes("=") ? part.replace("=", " eq ") : part))
    .join(" and ");
};

export const prepareInstanceServerSideFilters = (
  filters: string[],
): string[] => {
  return filters.map((filter) => {
    const items = filter.split("=");
    if (items.length == 2 && items[0] == "state") {
      return `status=${items[1]}`;
    } else {
      return filter;
    }
  });
};

export const getServerSupportedFilters = (
  filters: string[],
): [string[], string[]] => {
  const serverFilters: string[] = [];
  const clientFilters: string[] = [];

  filters.forEach((filter) => {
    const items = filter.split("=");

    if (
      items.length < 2 ||
      items[0].includes(".") ||
      items[1].includes(",") ||
      !serverSupportedFields.includes(items[0])
    ) {
      clientFilters.push(filter);
    } else {
      serverFilters.push(filter);
    }
  });

  return [serverFilters, clientFilters];
};

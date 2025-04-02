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

export const showInstance = (
  instance: LxdInstance,
  filters: string[],
): boolean => {
  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i].split("=");
    const key = filter[0];
    const value = filter[1];

    if (evaluateShorthandFilter(key, value, instance) == true) {
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

    if (items.length == 1) {
      let regexpValue = items[0];

      if (!(regexpValue.includes("^") || regexpValue.includes("$"))) {
        regexpValue = `^${regexpValue}$`;
      }

      return `name=(${regexpValue}|^${items[0]}.*)`;
    } else {
      let firstPart = items[0];
      if (firstPart.includes(".")) {
        firstPart = firstPart.split(".")[0];
      }

      if (!serverSupportedFields.includes(firstPart)) {
        return `expanded_config.${filter}`;
      }

      if (items[0] == "state") {
        return `status=${items[1]}`;
      }

      return filter;
    }
  });
};

export const getServerSupportedFilters = (
  filters: string[],
  clientSupportedFilters: string[],
): [string[], string[]] => {
  const serverFilters: string[] = [];
  const clientFilters: string[] = [];

  filters.forEach((filter) => {
    const items = filter.split("=");

    if (items.length == 1) {
      serverFilters.push(filter);
      return;
    }

    if (clientSupportedFilters.includes(items[0])) {
      clientFilters.push(filter);
    } else {
      serverFilters.push(filter);
    }
  });

  return [serverFilters, clientFilters];
};

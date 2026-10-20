import type { LxdInstance } from "types/instance";
import { getIpAddresses } from "util/networks";

export const TAGS_KEY = "user.tags";
export const TAG_COLORS_KEY = "user.tag_colors";
export const IP_TAGS_KEY = "user.ip_tags";

export interface TagChip {
  label: string;
  color: string;
  kind: "tag" | "ipv4" | "ipv6";
}

export interface KnownTag {
  tag: string;
  color: string;
}

export interface TagFormValues {
  tags: string[];
  tagColors: Record<string, string>;
  ipTags: Record<string, string>;
}

const TAG_KEYS = new Set([TAGS_KEY, TAG_COLORS_KEY, IP_TAGS_KEY]);

export const isTagConfigKey = (key: string): boolean => TAG_KEYS.has(key);

export const getTagFormValues = (
  config: Record<string, string | undefined>,
): TagFormValues => ({
  tags: parseTags(config[TAGS_KEY]),
  tagColors: parseKeyValues(config[TAG_COLORS_KEY]),
  ipTags: parseKeyValues(config[IP_TAGS_KEY]),
});

// Form values to config keys, undefined removes a key.
export const tagsPayload = (
  values?: Partial<TagFormValues>,
): Record<string, string | undefined> => {
  if (!values?.tags) {
    return {};
  }
  const tags = values.tags;
  const colors = Object.fromEntries(
    Object.entries(values.tagColors ?? {}).filter(([tag]) =>
      tags.includes(tag),
    ),
  );
  const ipTags = values.ipTags ?? {};
  return {
    [TAGS_KEY]: tags.length > 0 ? serializeTags(tags) : undefined,
    [TAG_COLORS_KEY]:
      Object.keys(colors).length > 0 ? serializeKeyValues(colors) : undefined,
    [IP_TAGS_KEY]:
      Object.keys(ipTags).length > 0 ? serializeKeyValues(ipTags) : undefined,
  };
};

const PALETTE = [
  "#1f77b4",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
  "#ff7f0e",
  "#0e7c7b",
  "#c2185b",
];

// "a;b;c" like Proxmox
export const parseTags = (value?: string): string[] => {
  const seen = new Set<string>();
  return (value ?? "")
    .split(";")
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag || seen.has(tag)) {
        return false;
      }
      seen.add(tag);
      return true;
    });
};

export const serializeTags = (tags: string[]): string => tags.join(";");

// "key=value;key=value"
export const parseKeyValues = (value?: string): Record<string, string> => {
  const result: Record<string, string> = {};
  (value ?? "").split(";").forEach((entry) => {
    const index = entry.indexOf("=");
    if (index <= 0) {
      return;
    }
    const key = entry.slice(0, index).trim();
    const val = entry.slice(index + 1).trim();
    if (key && val) {
      result[key] = val;
    }
  });
  return result;
};

export const serializeKeyValues = (map: Record<string, string>): string =>
  Object.entries(map)
    .map(([key, value]) => `${key}=${value}`)
    .join(";");

// Same tag, same color everywhere, without any configuration.
export const hashColor = (tag: string): string => {
  let hash = 0;
  for (const char of tag) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
};

export const textColorFor = (background: string): string => {
  const hex = background.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) {
    return "#ffffff";
  }
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
};

const configOf = (instance: LxdInstance) =>
  instance.expanded_config ?? instance.config ?? {};

const ownColors = (instance: LxdInstance): Record<string, string> =>
  parseKeyValues(configOf(instance)[TAG_COLORS_KEY]);

const isSame = (a: LxdInstance, b: LxdInstance) =>
  a.name === b.name && a.project === b.project;

// Own color, else the color another instance gave the tag, else hash.
export const getTagColor = (
  tag: string,
  instance: LxdInstance,
  instances: LxdInstance[],
): string => {
  const own = ownColors(instance)[tag];
  if (own) {
    return own;
  }

  const other = instances
    .filter((item) => !isSame(item, instance))
    .sort((a, b) => a.name.localeCompare(b.name))
    .find((item) => ownColors(item)[tag]);

  return other ? ownColors(other)[tag] : hashColor(tag);
};

export const getInstanceTagChips = (
  instance: LxdInstance,
  instances: LxdInstance[],
): TagChip[] => {
  const config = configOf(instance);
  const chips: TagChip[] = parseTags(config[TAGS_KEY]).map((tag) => ({
    label: tag,
    color: getTagColor(tag, instance, instances),
    kind: "tag",
  }));

  const ipTags = parseKeyValues(config[IP_TAGS_KEY]);
  if (ipTags.ipv4) {
    getIpAddresses(instance, "inet").forEach((ip) => {
      chips.push({ label: ip.address, color: ipTags.ipv4, kind: "ipv4" });
    });
  }
  if (ipTags.ipv6) {
    getIpAddresses(instance, "inet6").forEach((ip) => {
      chips.push({ label: ip.address, color: ipTags.ipv6, kind: "ipv6" });
    });
  }

  return chips;
};

// All tags in use, for suggestions.
export const getKnownTags = (instances: LxdInstance[]): KnownTag[] => {
  const known = new Map<string, string>();
  instances.forEach((instance) => {
    parseTags(configOf(instance)[TAGS_KEY]).forEach((tag) => {
      if (!known.has(tag)) {
        known.set(tag, getTagColor(tag, instance, instances));
      }
    });
  });
  return [...known.entries()]
    .map(([tag, color]) => ({ tag, color }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
};

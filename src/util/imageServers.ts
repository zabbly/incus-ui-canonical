export const IMAGE_SERVERS_KEY = "user.ui.image_servers";

export type ImageServerProtocol = "oci" | "simplestreams";

export interface ImageServer {
  name: string;
  url: string;
  protocol: ImageServerProtocol;
}

export interface OciImageReference {
  alias: string;
  server: string;
}

export const defaultImageServers: ImageServer[] = [
  {
    name: "images",
    url: "https://images.linuxcontainers.org",
    protocol: "simplestreams",
  },
  {
    name: "ubuntu",
    url: "https://cloud-images.ubuntu.com/releases",
    protocol: "simplestreams",
  },
  {
    name: "ubuntu-daily",
    url: "https://cloud-images.ubuntu.com/daily",
    protocol: "simplestreams",
  },
  {
    name: "ubuntu-minimal",
    url: "https://cloud-images.ubuntu.com/minimal/releases",
    protocol: "simplestreams",
  },
  {
    name: "ubuntu-minimal-daily",
    url: "https://cloud-images.ubuntu.com/minimal/daily",
    protocol: "simplestreams",
  },
];

// Parse the user.ui.image_servers config value into a list of servers.
// Falls back to an empty list when unset or malformed.
export const parseImageServers = (value?: string): ImageServer[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).url === "string"
        );
      })
      .map((item) => ({
        name: typeof item.name === "string" ? item.name : "",
        url: item.url as string,
        protocol: item.protocol === "oci" ? "oci" : "simplestreams",
      }));
  } catch {
    return [];
  }
};

export const serializeImageServers = (servers: ImageServer[]): string => {
  return JSON.stringify(servers);
};

export const getImageServerHost = (server?: string): string | undefined => {
  if (!server) {
    return undefined;
  }

  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(server) ? server : `https://${server}`,
    );
    return url.host.toLowerCase();
  } catch {
    return undefined;
  }
};

const hasOciVersion = (reference: string): boolean => {
  const imageName = reference.split("/").at(-1) ?? "";
  return reference.includes("@") || imageName.includes(":");
};

export const inferOciImageReference = (
  config: Record<string, string | undefined>,
): OciImageReference | undefined => {
  if (config["image.type"]?.toLowerCase() !== "oci") {
    return undefined;
  }

  const description = config["image.description"]
    ?.replace(/\s+\(OCI\)\s*$/i, "")
    .trim();
  if (!description) {
    return undefined;
  }

  const server = getImageServerHost(description);
  if (!server) {
    return undefined;
  }

  const descriptionPath = description
    .replace(/^[a-z][a-z\d+.-]*:\/\//i, "")
    .split("/")
    .slice(1)
    .join("/");
  const imageId = config["image.id"]?.trim() || descriptionPath;
  if (!imageId) {
    return undefined;
  }

  if (hasOciVersion(imageId)) {
    return { alias: imageId, server };
  }

  if (
    descriptionPath.startsWith(`${imageId}:`) ||
    descriptionPath.startsWith(`${imageId}@`)
  ) {
    return { alias: descriptionPath, server };
  }

  const version = config["image.version"]?.trim() || "latest";
  return { alias: `${imageId}:${version}`, server };
};

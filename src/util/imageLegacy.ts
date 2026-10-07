import type {
  RemoteImage,
  RemoteImageList,
  RemoteImagesResult,
} from "types/image";
import { capitalizeFirstLetter, handleResponse } from "util/helpers";
import type { ImageServer } from "util/imageServers";

export const linuxContainersServer = "https://images.linuxcontainers.org";

const streamsIndex = (server: string): string => {
  return `${server.replace(/\/$/, "")}/streams/v1/images.json`;
};

// fetching directly from hard coded indexes and servers,
// or from user-defined simplestreams servers when provided
export const loadRemoteImagesLegacy = async (
  userServers: ImageServer[] = [],
): Promise<RemoteImagesResult> => {
  const simpleStreamsServers = userServers.filter(
    (server) => server.protocol === "simplestreams",
  );

  // when user-defined servers are configured, they override the default list
  const servers =
    simpleStreamsServers.length > 0
      ? simpleStreamsServers.map((server) => ({
          url: server.url,
          name: server.name,
        }))
      : [{ url: linuxContainersServer, name: undefined }];

  const results = await Promise.all(
    servers.map(async ({ url, name }) =>
      loadImageJson(streamsIndex(url), url, name),
    ),
  );

  const images = results.flatMap((result) => result.images);
  const errors = results.map((result) => result.error).filter((e) => e !== "");

  return { images, error: errors.join(". ") };
};

const loadImageJson = async (
  file: string,
  server: string,
  serverName?: string,
): Promise<RemoteImagesResult> => {
  return new Promise((resolve) => {
    fetch(file)
      .then(handleResponse)
      .then((data: RemoteImageList) => {
        const images: RemoteImage[] = Object.entries(data.products).map(
          (product) => {
            const { os, ...image } = product[1];
            const formattedOs = capitalizeFirstLetter(os);
            return { ...image, os: formattedOs, server, serverName };
          },
        );
        resolve({ images, error: "" });
      })
      .catch((e: Error) => {
        resolve({ images: [], error: e.message });
      });
  });
};

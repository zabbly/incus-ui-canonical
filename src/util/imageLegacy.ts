import type {
  RemoteImage,
  RemoteImageList,
  RemoteImagesResult,
} from "types/image";
import { capitalizeFirstLetter, handleResponse } from "util/helpers";
import { byLtsFirst } from "util/images";

const linuxContainersJson =
  "https://images.linuxcontainers.org/streams/v1/images.json";
export const linuxContainersServer = "https://images.linuxcontainers.org";


// fetching directly from hard coded indexes and servers
export const loadRemoteImagesLegacy = async (): Promise<RemoteImagesResult> => {
  const linuxContainersImages = await loadImageJson(linuxContainersJson, linuxContainersServer);

  const images = [...linuxContainersImages.images];

  const errors = [
    linuxContainersImages.error,
  ].filter((e) => e !== "");

  return { images, error: errors.join(". ") };
};

const loadImageJson = async (
  file: string,
  server: string,
): Promise<RemoteImagesResult> => {
  return new Promise((resolve) => {
    fetch(file)
      .then(handleResponse)
      .then((data: RemoteImageList) => {
        const images: RemoteImage[] = Object.entries(data.products).map(
          (product) => {
            const { os, ...image } = product[1];
            const formattedOs = capitalizeFirstLetter(os);
            return { ...image, os: formattedOs, server: server };
          },
        );
        resolve({ images, error: "" });
      })
      .catch((e: Error) => {
        resolve({ images: [], error: e.message });
      });
  });
};

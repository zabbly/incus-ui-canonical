import { handleResponse } from "util/helpers";
import type { LxdApiResponse } from "types/apiResponse";
import type { LxdCertificate } from "types/certificate";
import { ROOT_PATH } from "util/rootPath";

export const fetchCertificates = async (): Promise<LxdCertificate[]> => {
  return fetch(`${ROOT_PATH}/1.0/certificates?recursion=1`)
    .then(handleResponse)
    .then((data: LxdApiResponse<LxdCertificate[]>) => {
      return data.metadata;
    });
};

export const addCertificate = async (
  token: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    fetch(`${ROOT_PATH}/1.0/certificates`, {
      method: "POST",
      body: JSON.stringify({
        type: "client",
        trust_token: token,
      }),
    })
      .then(handleResponse)
      .then(resolve)
      .catch(reject);
  });
};

import { handleRawResponse, handleResponse } from "util/helpers";
import type { LxdNetwork, LxdNetworkLoadBalancer } from "types/network";
import type { LxdApiResponse } from "types/apiResponse";

export const fetchNetworkLoadBalancers = async (
  network: string,
  project: string,
): Promise<LxdNetworkLoadBalancer[]> => {
  const params = new URLSearchParams();
  params.set("project", project);
  params.set("recursion", "1");

  return fetch(
    `/1.0/networks/${encodeURIComponent(network)}/load-balancers?${params.toString()}`,
  )
    .then(handleResponse)
    .then((data: LxdApiResponse<LxdNetworkLoadBalancer[]>) => {
      return data.metadata.sort(
        (a, b) =>
          a.listen_address.localeCompare(b.listen_address) * 10 +
          (a.location && b.location ? a.location.localeCompare(b.location) : 0),
      );
    });
};

export const fetchNetworkLoadBalancer = async (
  network: string,
  listenAddress: string,
  project: string,
): Promise<LxdNetworkLoadBalancer> => {
  const params = new URLSearchParams();
  params.set("project", project);
  params.set("recursion", "1");

  return fetch(
    `/1.0/networks/${encodeURIComponent(network)}/load-balancers/${encodeURIComponent(listenAddress)}?${params.toString()}`,
  )
    .then(handleResponse)
    .then((data: LxdApiResponse<LxdNetworkLoadBalancer>) => {
      return data.metadata;
    });
};

export const createNetworkLoadBalancer = async (
  network: string,
  loadBalancer: Partial<LxdNetworkLoadBalancer>,
  project: string,
): Promise<string> => {
  const params = new URLSearchParams();
  params.set("project", project);

  return fetch(
    `/1.0/networks/${encodeURIComponent(network)}/load-balancers?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loadBalancer),
    },
  )
    .then(handleRawResponse)
    .then((response) => {
      const locationHeader = response.headers.get("Location");
      const listenAddress = locationHeader?.split("/").pop() ?? "";
      return listenAddress;
    });
};

export const updateNetworkLoadBalancer = async (
  network: string,
  loadBalancer: LxdNetworkLoadBalancer,
  project: string,
): Promise<void> => {
  const params = new URLSearchParams();
  params.set("project", project);

  await fetch(
    `/1.0/networks/${encodeURIComponent(network)}/load-balancers/${encodeURIComponent(loadBalancer.listen_address)}?${params.toString()}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loadBalancer),
    },
  ).then(handleResponse);
};

export const deleteNetworkLoadBalancer = async (
  network: LxdNetwork,
  loadBalancer: LxdNetworkLoadBalancer,
  project: string,
): Promise<void> => {
  const params = new URLSearchParams();
  params.set("project", project);

  await fetch(
    `/1.0/networks/${encodeURIComponent(network.name)}/load-balancers/${encodeURIComponent(loadBalancer.listen_address)}?${params.toString()}`,
    {
      method: "DELETE",
    },
  ).then(handleResponse);
};

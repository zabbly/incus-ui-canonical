import parsePrometheusTextFormat from "parse-prometheus-text-format";
import type { LxdInstanceState } from "types/instance";
import type { LxdMetricGroup } from "types/metrics";
import { addTarget } from "util/target";
import { handleEtagResponse } from "util/helpers";

export const fetchMetrics = async (
  target: string,
): Promise<LxdMetricGroup[]> => {
  // in a simple and non-clustered environment, the LXD api responds
  // with instance.location as "none". Handle it, to avoid sending an invalid target
  const params = new URLSearchParams();
  addTarget(params, target);

  return fetch(`/1.0/metrics?${params.toString()}`)
    .then(async (response) => {
      return response.text();
    })
    .then((text) => {
      return parsePrometheusTextFormat(text);
    });
};

export const fetchInstanceState = (
  name: string,
  project: string,
): Promise<LxdInstanceState> => {
  const params = new URLSearchParams();
  params.set("project", project);

  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${encodeURIComponent(name)}/state?${params.toString()}`)
      .then(handleEtagResponse)
      .then((data) => resolve(data as LxdInstanceState))
      .catch(reject);
  });
};

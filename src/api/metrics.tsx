import parsePrometheusTextFormat from "parse-prometheus-text-format";
import type { LxdInstanceState } from "types/instance";
import type { LxdMetricGroup } from "types/metrics";
import { handleEtagResponse } from "util/helpers";

export const fetchMetrics = async (
  target: string,
): Promise<LxdMetricGroup[]> => {
  // in a simple and non-clustered environment, the LXD api responds
  // with instance.location as "none". Handle it, to avoid sending an invalid target
  const params = target === "none" ? "" : `?target=${target}`;

  return fetch(`/1.0/metrics${params}`)
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
  return new Promise((resolve, reject) => {
    fetch(`/1.0/instances/${name}/state?project=${project}`)
      .then(handleEtagResponse)
      .then((data) => resolve(data as LxdInstanceState))
      .catch(reject);
  });
};

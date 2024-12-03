import parsePrometheusTextFormat from "parse-prometheus-text-format";
import { LxdMetricGroup } from "types/metrics";
import { handleEtagResponse } from "util/helpers";
import { LxdInstanceState } from "types/instance";

export const fetchMetrics = (): Promise<LxdMetricGroup[]> => {
  return new Promise((resolve, reject) => {
    fetch("/1.0/metrics")
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        const json = parsePrometheusTextFormat(text);
        resolve(json);
      })
      .catch(reject);
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

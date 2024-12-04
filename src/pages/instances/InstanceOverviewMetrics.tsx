import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { fetchInstanceState } from "api/metrics";
import { getInstanceMetrics } from "util/metricSelectors";
import { humanCpuUsage, humanFileSize } from "util/helpers";
import Meter from "components/Meter";
import Loader from "components/Loader";
import { LxdInstance } from "types/instance";
import { useAuth } from "context/auth";

interface Props {
  instance: LxdInstance;
  onFailure: (title: string, e: unknown) => void;
}

const InstanceOverviewMetrics: FC<Props> = ({ instance, onFailure }) => {
  const { isRestricted } = useAuth();

    const {
    data: state,
    error,
    isLoading,
  } = useQuery({
    queryKey: [queryKeys.metrics],
    queryFn: () => fetchInstanceState(instance.name, instance.project),
    refetchInterval: 15 * 1000, // 15 seconds
    enabled: !isRestricted,
  });

  if (error) {
    onFailure("Loading metrics failed", error);
  }

  if (isRestricted) {
    return (
      <div className="u-text--muted">
        Details are not available for restricted users
      </div>
    );
  }

  return (
    <>
      {isLoading ? (
        <Loader text="Loading metrics..." />
      ) : (
        <table>
          <tbody>
            <tr className="metric-row">
              <th className="u-text--muted">CPU Time(s)</th>
              <td>
                {state.cpu && state.cpu.usage > 0 ? (
                  <div>
                    {humanCpuUsage(state.cpu.usage)}
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
            <tr className="metric-row">
              <th className="u-text--muted">Memory</th>
              <td>
                {state.memory ? (
                  <div>
                    <Meter
                      percentage={
                        (100 / state.memory.total) *
                        state.memory.usage
                      }
                      text={
                        humanFileSize(
                          state.memory.usage
                        ) +
                        " of " +
                        humanFileSize(state.memory.total) +
                        " memory used"
                      }
                    />
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
            <tr className="metric-row">
              <th className="u-text--muted">Disk</th>
              <td>
                {state.disk ? (
                  <div>
                    <Meter
                      percentage={
                        (100 / state.disk.root.total) *
                        state.disk.root.usage
                      }
                      text={
                        humanFileSize(
                          state.disk.root.usage
                        ) +
                        " of " +
                        (state.disk.root.total ? (humanFileSize(state.disk.root.total) +
                        " disk used") : ("unlimited"))
                      }
                    />
                  </div>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  );
};

export default InstanceOverviewMetrics;

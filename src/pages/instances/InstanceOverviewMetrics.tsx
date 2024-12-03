import { FC } from "react";
import { humanCpuUsage, humanFileSize } from "util/helpers";
import Meter from "components/Meter";
import { LxdInstanceState } from "types/instance";
import { useAuth } from "context/auth";

interface Props {
  state: LxdInstanceState;
  onFailure: (title: string, e: unknown) => void;
}

const InstanceOverviewMetrics: FC<Props> = ({ state, onFailure }) => {
  const { isRestricted } = useAuth();

  if (isRestricted) {
    return (
      <div className="u-text--muted">
        Details are not available for restricted users
      </div>
    );
  }

  return (
    <>
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
                      humanFileSize(state.disk.root.total) +
                      " disk used"
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
    </>
  );
};

export default InstanceOverviewMetrics;

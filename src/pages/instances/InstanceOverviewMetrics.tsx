import type { FC } from "react";
import { Spinner } from "@canonical/react-components";
import type { LxdInstance } from "types/instance";
import { useAuth } from "context/auth";
import { useInstanceState } from "context/useInstanceState";
import InstanceStateUsageCpu from "pages/instances/InstanceStateUsageCpu";
import InstanceStateUsageMemory from "pages/instances/InstanceStateUsageMemory";
import InstanceStateUsageRootDisk from "pages/instances/InstanceStateUsageRootDisk";

interface Props {
  instance: LxdInstance;
  onFailure: (title: string, e: unknown) => void;
}

const InstanceOverviewMetrics: FC<Props> = ({ instance, onFailure }) => {
  const { isRestricted } = useAuth();
  const {
    data: state,
    dataUpdatedAt,
    error,
    isLoading,
  } = useInstanceState(instance);

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

  if (isLoading) {
    return <Spinner className="u-loader" text="Loading metrics..." />;
  }

  return (
    <table>
      <tbody>
        <tr className="metric-row">
          <th className="u-text--muted">CPU</th>
          <td>
            <InstanceStateUsageCpu
              instance={instance}
              state={state}
              updatedAt={dataUpdatedAt}
            />
          </td>
        </tr>
        <tr className="metric-row">
          <th className="u-text--muted">Memory</th>
          <td>
            <InstanceStateUsageMemory state={state} />
          </td>
        </tr>
        <tr className="metric-row">
          <th className="u-text--muted">Root filesystem</th>
          <td>
            <InstanceStateUsageRootDisk instance={instance} state={state} />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default InstanceOverviewMetrics;

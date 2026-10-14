import type { FC } from "react";
import Meter from "components/Meter";
import { humanCpuUsage } from "util/helpers";
import { getCpuCores, trackCpuUsage } from "util/instanceState";
import type { LxdInstance, LxdInstanceState } from "types/instance";

interface Props {
  instance: LxdInstance;
  state?: LxdInstanceState;
  updatedAt: number;
}

const InstanceStateUsageCpu: FC<Props> = ({ instance, state, updatedAt }) => {
  const percentage = trackCpuUsage(instance, state, updatedAt);

  if (!state?.cpu || state.cpu.usage <= 0) {
    return "-";
  }

  const cores = getCpuCores(instance, state);
  const cpuTime = `${humanCpuUsage(state.cpu.usage)} s cpu time`;

  if (percentage === undefined) {
    return (
      <div
        className="p-text--small u-no-margin--bottom u-text--muted"
        title={cpuTime}
      >
        measuring
      </div>
    );
  }

  return (
    <Meter
      percentage={percentage}
      text={`${percentage.toFixed(1)} % of ${cores} CPU${cores === 1 ? "" : "s"}`}
      hoverText={cpuTime}
    />
  );
};

export default InstanceStateUsageCpu;

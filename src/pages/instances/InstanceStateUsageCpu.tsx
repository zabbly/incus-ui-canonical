import type { FC } from "react";
import Meter from "components/Meter";
import { humanCpuUsage } from "util/helpers";
import { useCpuPercentage } from "context/useCpuPercentage";
import type { LxdInstance, LxdInstanceState } from "types/instance";

interface Props {
  instance: LxdInstance;
  state?: LxdInstanceState;
  updatedAt: number;
}

const InstanceStateUsageCpu: FC<Props> = ({ instance, state, updatedAt }) => {
  const percentage = useCpuPercentage(instance, state, updatedAt);

  if (!state?.cpu || state.cpu.usage <= 0) {
    return "-";
  }

  const cpuTime = `${humanCpuUsage(state.cpu.usage)} s cpu time`;

  if (percentage === undefined) {
    return <span className="u-text--muted">{cpuTime}</span>;
  }

  return (
    <Meter
      percentage={percentage}
      text={`${percentage.toFixed(1)} %`}
      hoverText={cpuTime}
    />
  );
};

export default InstanceStateUsageCpu;

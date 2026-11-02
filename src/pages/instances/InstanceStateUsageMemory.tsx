import type { FC } from "react";
import Meter from "components/Meter";
import { humanFileSize } from "util/helpers";
import type { LxdInstanceState } from "types/instance";

interface Props {
  state?: LxdInstanceState;
}

const InstanceStateUsageMemory: FC<Props> = ({ state }) => {
  const memory = state?.memory;

  if (!memory || memory.total <= 0) {
    return "-";
  }

  return (
    <Meter
      percentage={(100 / memory.total) * memory.usage}
      text={`${humanFileSize(memory.usage)} of ${humanFileSize(memory.total)}`}
    />
  );
};

export default InstanceStateUsageMemory;

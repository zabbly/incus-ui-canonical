import type { FC } from "react";
import Meter from "components/Meter";
import { humanFileSize } from "util/helpers";
import { getRootDiskUsage } from "util/instanceState";
import type { LxdInstance, LxdInstanceState } from "types/instance";

interface Props {
  instance: LxdInstance;
  state?: LxdInstanceState;
}

const InstanceStateUsageRootDisk: FC<Props> = ({ instance, state }) => {
  const disk = getRootDiskUsage(instance, state);

  if (!disk) {
    return "-";
  }

  if (disk.total <= 0) {
    return (
      <span className="u-text--muted">
        {humanFileSize(disk.usage)} used, unlimited
      </span>
    );
  }

  return (
    <Meter
      percentage={(100 / disk.total) * disk.usage}
      text={`${humanFileSize(disk.usage)} of ${humanFileSize(disk.total)}`}
    />
  );
};

export default InstanceStateUsageRootDisk;

import type { FC } from "react";
import { OSInfoList, OSInfoSection } from "pages/os/info/OSInfoView";
import type { IncusOSKernel } from "types/os";
import { humanFileSize } from "util/helpers";

interface Props {
  data: IncusOSKernel;
}

const OSKernelInfo: FC<Props> = ({ data }) => {
  const swap = data.state?.memory?.zram_swap;

  if (!swap) {
    return (
      <OSInfoSection title="Zram swap">
        <p className="u-text--muted">No zram-backed swap device configured</p>
      </OSInfoSection>
    );
  }

  const uncompressed = swap.uncompressed_size ?? swap.incompressed_size ?? 0;

  return (
    <OSInfoSection title="Zram swap">
      <OSInfoList
        items={[
          ["Disk size", humanFileSize(swap.disk_size ?? 0, 2)],
          ["Uncompressed data", humanFileSize(uncompressed, 2)],
          ["Compressed data", humanFileSize(swap.compressed_size ?? 0, 2)],
          ["Compression ratio", (swap.compression_ratio ?? 0).toFixed(2)],
          ["Total memory used", humanFileSize(swap.total_memory_use ?? 0, 2)],
        ]}
      />
    </OSInfoSection>
  );
};

export default OSKernelInfo;

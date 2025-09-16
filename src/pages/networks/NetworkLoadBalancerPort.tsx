import type { FC } from "react";
import type { LxdNetworkLoadBalancerPort } from "types/network";

interface Props {
  port: LxdNetworkLoadBalancerPort;
}

const NetworkLoadBalancerPort: FC<Props> = ({ port }) => {
  const rightArrow = String.fromCharCode(8594);
  const caption = `:${port.listen_port} ${rightArrow} ${port.target_backend} (${port.protocol})`;

  return (
    <div className="u-truncate" title={caption}>
      {caption}
    </div>
  );
};

export default NetworkLoadBalancerPort;

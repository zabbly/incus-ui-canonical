import type { FC } from "react";
import { OSInfoSection, OSInfoTable, lines } from "pages/os/info/OSInfoView";
import type { IncusOSNetwork } from "types/os";

interface Props {
  data: IncusOSNetwork;
}

const OSNetworkInfo: FC<Props> = ({ data }) => {
  const interfaces = data.state?.interfaces ?? {};
  const names = Object.keys(interfaces).sort();

  return (
    <OSInfoSection title="Interfaces">
      <OSInfoTable
        headers={[
          "Name",
          "Type",
          "State",
          "MAC address",
          "MTU",
          "Speed",
          "Addresses",
          "Roles",
        ]}
        rows={names.map((name) => {
          const iface = interfaces[name];

          return [
            name,
            iface.type,
            iface.state,
            iface.hwaddr,
            iface.mtu,
            iface.speed,
            lines(iface.addresses),
            lines(iface.roles),
          ];
        })}
        emptyMessage="No interfaces found"
      />
    </OSInfoSection>
  );
};

export default OSNetworkInfo;

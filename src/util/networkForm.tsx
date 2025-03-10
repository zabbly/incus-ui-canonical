import {
  LxdNetwork,
  LxdNetworkAcl,
  LxdNetworkBridgeDriver,
  LxdNetworkDnsMode,
} from "types/network";
import { NetworkFormValues } from "pages/networks/forms/NetworkForm";
import { NetworkAclFormValues } from "pages/networks/forms/NetworkAclForm";
import { getNetworkKey } from "util/networks";

export const toNetworkFormValues = (network: LxdNetwork): NetworkFormValues => {
  return {
    readOnly: true,
    isCreating: false,
    name: network.name,
    description: network.description,
    networkType: network.type,
    bridge_driver: network.config[
      getNetworkKey("bridge_driver")
    ] as LxdNetworkBridgeDriver,
    bridge_hwaddr: network.config[getNetworkKey("bridge_hwaddr")],
    bridge_mtu: network.config[getNetworkKey("bridge_mtu")],
    dns_domain: network.config[getNetworkKey("dns_domain")],
    dns_mode: network.config[getNetworkKey("dns_mode")] as LxdNetworkDnsMode,
    dns_nameservers: network.config[getNetworkKey("dns_nameservers")],
    dns_search: network.config[getNetworkKey("dns_search")],
    ipv4_address: network.config[getNetworkKey("ipv4_address")],
    ipv4_dhcp: network.config[getNetworkKey("ipv4_dhcp")],
    ipv4_dhcp_expiry: network.config[getNetworkKey("ipv4_dhcp_expiry")],
    ipv4_dhcp_ranges: network.config[getNetworkKey("ipv4_dhcp_ranges")],
    ipv4_l3only: network.config[getNetworkKey("ipv4_l3only")],
    ipv4_nat: network.config[getNetworkKey("ipv4_nat")],
    ipv4_nat_address: network.config[getNetworkKey("ipv4_nat_address")],
    ipv4_ovn_ranges: network.config[getNetworkKey("ipv4_ovn_ranges")],
    ipv4_gateway: network.config[getNetworkKey("ipv4_gateway")],
    ipv4_routes: network.config[getNetworkKey("ipv4_routes")],
    ipv4_routes_anycast: network.config[getNetworkKey("ipv4_routes_anycast")],
    ipv6_address: network.config[getNetworkKey("ipv6_address")],
    ipv6_dhcp: network.config[getNetworkKey("ipv6_dhcp")],
    ipv6_dhcp_expiry: network.config[getNetworkKey("ipv6_dhcp_expiry")],
    ipv6_dhcp_ranges: network.config[getNetworkKey("ipv6_dhcp_ranges")],
    ipv6_dhcp_stateful: network.config[getNetworkKey("ipv6_dhcp_stateful")],
    ipv6_l3only: network.config[getNetworkKey("ipv6_l3only")],
    ipv6_nat: network.config[getNetworkKey("ipv6_nat")],
    ipv6_nat_address: network.config[getNetworkKey("ipv6_nat_address")],
    ipv6_ovn_ranges: network.config[getNetworkKey("ipv6_ovn_ranges")],
    ipv6_gateway: network.config[getNetworkKey("ipv6_gateway")],
    ipv6_routes: network.config[getNetworkKey("ipv6_routes")],
    ipv6_routes_anycast: network.config[getNetworkKey("ipv6_routes_anycast")],
    ovn_ingress_mode: network.config[getNetworkKey("ovn_ingress_mode")],
    network: network.config.network,
    parent: network.config.parent,
    entityType: "network",
    bareNetwork: network,
  };
};

export const toNetworkAclFormValues = (
  acl: LxdNetworkAcl,
): NetworkAclFormValues => {
  return {
    readOnly: true,
    isCreating: false,
    name: acl.name,
    description: acl.description,
    entityType: "networkAcl",
  };
};

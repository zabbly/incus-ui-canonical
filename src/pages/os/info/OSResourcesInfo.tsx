import type { FC, ReactNode } from "react";
import {
  OSInfoList,
  OSInfoSection,
  OSInfoTable,
  lines,
} from "pages/os/info/OSInfoView";
import type { OSInfoItem } from "pages/os/info/OSInfoView";
import type {
  CpuSockets,
  GpuCard,
  LxdResources,
  NetworkCards,
  Ports,
  Sriov,
} from "types/resources";
import { humanFileSize } from "util/helpers";

interface MdevProfile {
  name?: string;
  available?: number;
}

interface SerialDevice {
  id?: string;
  device?: string;
  device_id?: string;
  device_path?: string;
  vendor?: string;
  vendor_id?: string;
  product?: string;
  product_id?: string;
  driver?: string;
}

// Fields missing from the shared resources type.
type Resources = Partial<LxdResources> & {
  serial?: { devices?: SerialDevice[] | null };
};

const size = (bytes?: number, precision = 2) =>
  humanFileSize(bytes ?? 0, precision);

const withId = (name?: string, id?: string) => {
  if (!name) {
    return "";
  }

  return id ? `${name} (${id})` : name;
};

const sriovLine = (sriov?: Sriov | null) =>
  sriov ? `SR-IOV: ${sriov.current_vfs} of ${sriov.maximum_vfs} VFs` : null;

const present = (values: (ReactNode | null)[]) =>
  values.filter((value) => value !== null && value !== "");

const cpuItems = (socket: CpuSockets): OSInfoItem[] => {
  let frequency = "";
  if (socket.frequency > 0) {
    frequency = `${socket.frequency}Mhz`;
    if (socket.frequency_turbo > 0 && socket.frequency_minimum > 0) {
      frequency += ` (min: ${socket.frequency_minimum}Mhz, max: ${socket.frequency_turbo}Mhz)`;
    }
  }

  return [
    ["Vendor", socket.vendor],
    ["Name", socket.name],
    [
      "Caches",
      socket.cache?.length
        ? lines(
            socket.cache.map(
              (cache) =>
                `Level ${cache.level} (type: ${cache.type}): ${size(cache.size, 0)}`,
            ),
          )
        : "",
    ],
    ["Frequency", frequency],
  ];
};

const CpuCores: FC<{ socket: CpuSockets }> = ({ socket }) => (
  <OSInfoTable
    headers={["Core", "Frequency", "Threads"]}
    rows={(socket.cores ?? []).map((core) => [
      core.core,
      `${core.frequency}Mhz`,
      lines(
        (core.threads ?? []).map(
          (thread) =>
            `${thread.thread} (id: ${thread.id}, online: ${thread.online}, NUMA node: ${thread.numa_node})`,
        ),
      ),
    ])}
  />
);

const gpuDetails = async (gpu: GpuCard) => {
  const mdev = (gpu.mdev ?? {}) as Record<string, MdevProfile>;

  return lines(
    present([
      gpu.drm?.card_name
        ? `DRM: ${gpu.drm.card_name} (${gpu.drm.card_device})`
        : null,
      gpu.nvidia
        ? `NVIDIA: ${gpu.nvidia.brand} ${gpu.nvidia.model} (CUDA ${gpu.nvidia.cuda_version}, NVRM ${gpu.nvidia.nvrm_version})`
        : null,
      sriovLine(gpu.sriov),
      ...Object.keys(mdev)
        .sort()
        .map(
          (key) =>
            `Mdev: ${key} (${mdev[key].name}) (${mdev[key].available} available)`,
        ),
    ]),
  );
};

const portLine = (port: Ports) => {
  const parts = [`Port ${port.port} (${port.protocol})`, port.id];

  if (port.address) {
    parts.push(port.address);
  }

  if (port.port_type) {
    parts.push(port.port_type);
  }

  parts.push(port.link_detected ? "link detected" : "no link");

  if (port.link_speed > 0) {
    parts.push(`${port.link_speed}Mbit/s (${port.link_duplex} duplex)`);
  }

  return parts.join(", ");
};

const nicDetails = async (nic: NetworkCards) =>
  lines(present([...(nic.ports ?? []).map(portLine), sriovLine(nic.sriov)]));

interface Props {
  data: object;
}

const OSResourcesInfo: FC<Props> = ({ data }) => {
  const resources = data as Resources;
  const system = resources.system;
  const load = resources.load;
  const memory = resources.memory;
  const sockets = resources.cpu?.sockets ?? [];
  const nodes = memory?.nodes ?? [];
  const gpus = resources.gpu?.cards ?? [];
  const nics = resources.network?.cards ?? [];
  const disks = resources.storage?.disks ?? [];
  const usb = resources.usb?.devices ?? [];
  const pci = resources.pci?.devices ?? [];
  const serial = resources.serial?.devices ?? [];

  return (
    <>
      <OSInfoSection title="System">
        <OSInfoList
          items={[
            ["UUID", system?.uuid],
            ["Vendor", system?.vendor],
            ["Product", system?.product],
            ["Family", system?.family],
            ["Version", system?.version],
            ["SKU", system?.sku],
            ["Serial", system?.serial],
            ["Type", system?.type],
            ["Chassis vendor", system?.chassis?.vendor],
            ["Chassis type", system?.chassis?.type],
            ["Chassis version", system?.chassis?.version],
            ["Chassis serial", system?.chassis?.serial],
            ["Motherboard vendor", system?.motherboard?.vendor],
            ["Motherboard product", system?.motherboard?.product],
            ["Motherboard serial", system?.motherboard?.serial],
            ["Motherboard version", system?.motherboard?.version],
            ["Firmware vendor", system?.firmware?.vendor],
            ["Firmware version", system?.firmware?.version],
            ["Firmware date", system?.firmware?.date],
          ]}
        />
      </OSInfoSection>

      {load && load.processes > 0 && (
        <OSInfoSection title="Load">
          <OSInfoList
            items={[
              ["Processes", load.processes],
              [
                "Average",
                [load.average1min, load.average5min, load.average10min]
                  .map((value) => (value ?? 0).toFixed(2))
                  .join(" "),
              ],
            ]}
          />
        </OSInfoSection>
      )}

      {sockets.length > 0 && (
        <OSInfoSection title={sockets.length > 1 ? "CPUs" : "CPU"}>
          <OSInfoList items={[["Architecture", resources.cpu?.architecture]]} />
          {sockets.map((socket) => (
            <div key={socket.socket}>
              {sockets.length > 1 && (
                <h3 className="p-heading--5">Socket {socket.socket}</h3>
              )}
              <OSInfoList items={cpuItems(socket)} />
              <CpuCores socket={socket} />
            </div>
          ))}
        </OSInfoSection>
      )}

      <OSInfoSection title="Memory">
        <OSInfoList
          items={[
            ["Free", size((memory?.total ?? 0) - (memory?.used ?? 0))],
            ["Used", size(memory?.used)],
            ["Total", size(memory?.total)],
            ...((memory?.hugepages_total ?? 0) > 0
              ? ([
                  [
                    "Hugepages free",
                    size(
                      (memory?.hugepages_total ?? 0) -
                        (memory?.hugepages_used ?? 0),
                    ),
                  ],
                  ["Hugepages used", size(memory?.hugepages_used)],
                  ["Hugepages total", size(memory?.hugepages_total)],
                ] as OSInfoItem[])
              : []),
          ]}
        />
        {nodes.length > 1 && (
          <OSInfoTable
            headers={["NUMA node", "Free", "Used", "Total"]}
            rows={nodes.map((node) => [
              node.numa_node,
              size(node.total - node.used),
              size(node.used),
              size(node.total),
            ])}
          />
        )}
      </OSInfoSection>

      {gpus.length > 0 && (
        <OSInfoSection title={gpus.length > 1 ? "GPUs" : "GPU"}>
          <OSInfoTable
            headers={[
              "NUMA node",
              "Vendor",
              "Product",
              "PCI address",
              "Driver",
              "Details",
            ]}
            rows={gpus.map((gpu) => [
              gpu.numa_node,
              withId(gpu.vendor, gpu.vendor_id),
              withId(gpu.product, gpu.product_id),
              gpu.pci_address,
              withId(gpu.driver, gpu.driver_version),
              gpuDetails(gpu),
            ])}
          />
        </OSInfoSection>
      )}

      {nics.length > 0 && (
        <OSInfoSection title={nics.length > 1 ? "NICs" : "NIC"}>
          <OSInfoTable
            headers={[
              "NUMA node",
              "Vendor",
              "Product",
              "PCI address",
              "Driver",
              "Ports",
            ]}
            rows={nics.map((nic) => [
              nic.numa_node,
              withId(nic.vendor, nic.vendor_id),
              withId(nic.product, nic.product_id),
              nic.pci_address,
              withId(nic.driver, nic.driver_version),
              nicDetails(nic),
            ])}
          />
        </OSInfoSection>
      )}

      {disks.length > 0 && (
        <OSInfoSection title={disks.length > 1 ? "Disks" : "Disk"}>
          <OSInfoTable
            headers={[
              "ID",
              "Device",
              "Model",
              "Type",
              "Size",
              "WWN",
              "NUMA node",
              "Read-only",
              "Removable",
              "Partitions",
            ]}
            rows={disks.map((disk) => [
              disk.id,
              disk.device,
              disk.model,
              disk.type,
              size(disk.size),
              disk.wwn,
              disk.numa_node,
              String(disk.read_only),
              String(disk.removable),
              lines(
                (disk.partitions ?? []).map(
                  (partition) =>
                    `${partition.id} (${size(partition.size)}${partition.read_only ? ", read-only" : ""})`,
                ),
              ),
            ])}
          />
        </OSInfoSection>
      )}

      {usb.length > 0 && (
        <OSInfoSection title={usb.length > 1 ? "USB devices" : "USB device"}>
          <OSInfoTable
            headers={[
              "Vendor",
              "Vendor ID",
              "Product",
              "Product ID",
              "Bus address",
              "Device address",
              "Serial number",
            ]}
            rows={usb.map((device) => [
              device.vendor,
              device.vendor_id,
              device.product,
              device.product_id,
              device.bus_address,
              device.device_address,
              device.serial,
            ])}
          />
        </OSInfoSection>
      )}

      {pci.length > 0 && (
        <OSInfoSection title={pci.length > 1 ? "PCI devices" : "PCI device"}>
          <OSInfoTable
            headers={[
              "Address",
              "Vendor",
              "Vendor ID",
              "Product",
              "Product ID",
              "NUMA node",
              "IOMMU group",
              "Driver",
            ]}
            rows={pci.map((device) => [
              device.pci_address,
              device.vendor,
              device.vendor_id,
              device.product,
              device.product_id,
              device.numa_node,
              device.iommu_group,
              device.driver,
            ])}
          />
        </OSInfoSection>
      )}

      {serial.length > 0 && (
        <OSInfoSection
          title={serial.length > 1 ? "Serial devices" : "Serial device"}
        >
          <OSInfoTable
            headers={[
              "ID",
              "Device",
              "Device ID",
              "Device path",
              "Vendor",
              "Vendor ID",
              "Product",
              "Product ID",
              "Driver",
            ]}
            rows={serial.map((device) => [
              device.id,
              device.device,
              device.device_id,
              device.device_path,
              device.vendor,
              device.vendor_id,
              device.product,
              device.product_id,
              device.driver,
            ])}
          />
        </OSInfoSection>
      )}
    </>
  );
};

export default OSResourcesInfo;

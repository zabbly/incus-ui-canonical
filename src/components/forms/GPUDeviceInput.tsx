import type { FC } from "react";
import { useState } from "react";
import { Input, RadioInput } from "@canonical/react-components";
import type { LxdGPUDevice } from "types/device";

export interface GpuIdentifier {
  pci?: string;
  id?: string;
  vendorid?: string;
  productid?: string;
}

interface Props {
  device: LxdGPUDevice;
  onChange?: (identifier: GpuIdentifier) => void;
  disableReason?: string;
}

const getInitialType = (device: LxdGPUDevice) => {
  if (device.pci) {
    return "pci";
  }
  if (device.vendorid ?? device.productid) {
    return "vendor";
  }
  return "id";
};

const GpuDeviceInput: FC<Props> = ({ device, onChange, disableReason }) => {
  const [type, setType] = useState(getInitialType(device));
  const key = `device.${device.name}.${type}`;

  return (
    <>
      <div className="u-sv1">
        <RadioInput
          inline
          labelClassName="margin-right--large"
          label="ID"
          checked={type === "id"}
          onClick={() => {
            setType("id");
          }}
          disabled={!!disableReason}
        />
        <RadioInput
          inline
          labelClassName="margin-right--large"
          label="PCI"
          checked={type === "pci"}
          onClick={() => {
            setType("pci");
          }}
          disabled={!!disableReason}
        />
        <RadioInput
          inline
          label="Vendor"
          checked={type === "vendor"}
          onClick={() => {
            setType("vendor");
          }}
          disabled={!!disableReason}
        />
      </div>
      {type === "vendor" ? (
        <>
          <Input
            key={`${key}.vendorid`}
            type="text"
            label="Vendor ID"
            value={device.vendorid}
            onChange={(e) =>
              onChange?.({
                vendorid: e.target.value,
                productid: device.productid,
              })
            }
            disabled={!!disableReason}
          />
          <Input
            key={`${key}.productid`}
            type="text"
            label="Product ID"
            value={device.productid}
            onChange={(e) =>
              onChange?.({
                vendorid: device.vendorid,
                productid: e.target.value,
              })
            }
            disabled={!!disableReason}
          />
        </>
      ) : (
        <Input
          key={key}
          type="text"
          label={type === "pci" ? "PCI Address" : "ID"}
          value={type === "pci" ? device.pci : device.id}
          onChange={(e) =>
            onChange?.(
              type === "pci" ? { pci: e.target.value } : { id: e.target.value },
            )
          }
          disabled={!!disableReason}
        />
      )}
    </>
  );
};
export default GpuDeviceInput;

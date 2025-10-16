import ResourceLink from "components/ResourceLink";
import type { FC } from "react";
import type { LxdNicDevice, LxdNoneDevice } from "types/device";
import NetworkDeviceAcls from "./NetworkDeviceAcls";
import type { LxdNetwork } from "types/network";
import NetworkSelector from "pages/projects/forms/NetworkSelector";
import type { InstanceAndProfileFormikProps } from "components/forms/instanceAndProfileFormValues";
import { supportsNicDeviceAcls } from "util/networks";
import { isNoneDevice } from "util/devices";

interface Props {
  readOnly: boolean;
  project: string;
  formik: InstanceAndProfileFormikProps;
  device: LxdNicDevice | LxdNoneDevice;
  index: number;
  filteredNetworks: LxdNetwork[];
  network?: LxdNetwork;
}

const NetworkDeviceContent: FC<Props> = ({
  readOnly,
  project,
  formik,
  device,
  index,
  filteredNetworks,
  network,
}) => {
  if (isNoneDevice(device)) {
    return (
      <span className="u-text--muted">
        <i>detached</i>
      </span>
    );
  }

  const deviceValue = device.network || device.parent;

  if (readOnly) {
    return (
      <>
        <div>Network</div>
        <ResourceLink
          type="network"
          value={deviceValue}
          to={`/ui/project/${encodeURIComponent(project ?? "")}/network/${encodeURIComponent(deviceValue)}`}
        />
        <NetworkDeviceAcls
          project={project}
          network={network}
          device={device}
          readOnly
        />
      </>
    );
  }

  return (
    <>
      <NetworkSelector
        value={deviceValue}
        setValue={(value) => {
          formik.setFieldValue(`devices.${index}.network`, value);

          const selectedNetwork = filteredNetworks.find(
            (t) => t.name === value,
          );

          let nicType = "";
          let parent = "";
          if (selectedNetwork.managed == false) {
            nicType = "bridged";
            parent = value;
          }

          formik.setFieldValue(`devices.${index}.nictype`, nicType);
          formik.setFieldValue(`devices.${index}.parent`, parent);

          if (selectedNetwork && !supportsNicDeviceAcls(selectedNetwork)) {
            formik.setFieldValue(
              `devices.${index}["security.acls"]`,
              undefined,
            );
          }
        }}
        id={`devices.${index}.network`}
        name={`devices.${index}.network`}
        filteredNetworks={filteredNetworks}
      />
      <NetworkDeviceAcls
        project={project}
        network={network}
        device={device}
        readOnly={readOnly}
        formik={formik}
        canSelectManualAcls={supportsNicDeviceAcls(network)}
      />
    </>
  );
};

export default NetworkDeviceContent;

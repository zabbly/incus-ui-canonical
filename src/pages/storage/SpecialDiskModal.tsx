import { FC, ReactNode, useState } from "react";
import { Button, Modal, Select } from "@canonical/react-components";
import { InstanceAndProfileFormikProps } from "components/forms/instanceAndProfileFormValues";
import { LxdDiskDevice } from "types/device";
import { getSpecialDiskSourceOptions } from "util/storageVolume";

interface Props {
  formik: InstanceAndProfileFormikProps;
  onFinish: (device: LxdDiskDevice) => void;
  onCancel: () => void;
  onClose: () => void;
  title?: ReactNode;
}

const HostPathDeviceModal: FC<Props> = ({
  formik,
  onFinish,
  onCancel,
  onClose,
  title,
}) => {
  const [source, setSource] = useState(getSpecialDiskSourceOptions()[0].value);
  const handleFinish = () => {
    const device: LxdDiskDevice = {
      type: "disk",
      source,
    };

    onFinish(device);
  };

  return (
    <Modal
      className="host-path-device-modal"
      close={onClose}
      title={title}
      buttonRow={
        <>
          <Button
            appearance="base"
            className="u-no-margin--bottom"
            type="button"
            onClick={onCancel}
          >
            Back
          </Button>
          <Button
            appearance=""
            className="u-no-margin--bottom"
            type="button"
            loading={formik.isSubmitting}
            onClick={handleFinish}
          >
            Attach
          </Button>
        </>
      }
    >
      <Select
        id="source"
        value={source}
        onChange={(e) => {
          setSource(e.target.value);
        }}
        label="Source"
        required
        options={getSpecialDiskSourceOptions()}
        error={!source ? "Source is required" : undefined}
      />
    </Modal>
  );
};

export default HostPathDeviceModal;

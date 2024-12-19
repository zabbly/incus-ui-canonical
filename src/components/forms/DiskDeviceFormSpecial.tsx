import { FC } from "react";
import { Button, Icon, Label, Select } from "@canonical/react-components";
import { InstanceAndProfileFormikProps } from "./instanceAndProfileFormValues";
import { EditInstanceFormValues } from "pages/instances/EditInstance";
import {
  deduplicateName,
  FormDiskDevice,
  removeDevice,
} from "util/formDevices";
import RenameDeviceInput from "./RenameDeviceInput";
import ConfigurationTable from "components/ConfigurationTable";
import { MainTableRow } from "@canonical/react-components/dist/components/MainTable/MainTable";
import { getConfigurationRowBase } from "components/ConfigurationRow";
import DetachDiskDeviceBtn from "pages/instances/actions/DetachDiskDeviceBtn";
import { isRootDisk, isSpecialDisk } from "util/instanceValidation";
import { ensureEditMode } from "util/instanceEdit";
import { getExistingDeviceNames } from "util/devices";
import { LxdProfile } from "types/profile";

interface Props {
  formik: InstanceAndProfileFormikProps;
  project: string;
  profiles: LxdProfile[];
}

const DiskDeviceFormSpecial: FC<Props> = ({ formik, project, profiles }) => {
  const readOnly = (formik.values as EditInstanceFormValues).readOnly;
  const specialDisks = formik.values.devices
    .filter((item) => item.type === "disk" && isSpecialDisk(item) && !isRootDisk(item))
    .map((device) => device as FormDiskDevice);

  const existingDeviceNames = getExistingDeviceNames(formik.values, profiles);

  const getSourceOptions = () => {
    const options = [{
      label: "cloud-init:config",
      value: "cloud-init:config",
    }, {
      label: "agent:config",
      value: "agent:config",
    }];
    return options;
  };

  const addSpecialDisk = () => {
    const copy = [...formik.values.devices];
    copy.push({
      type: "disk",
      name: deduplicateName("config", 1, existingDeviceNames),
      source: "cloud-init:config",
    });
    void formik.setFieldValue("devices", copy);
  };

  const rows: MainTableRow[] = [];
  specialDisks.map((formDisk) => {
    const index = formik.values.devices.indexOf(formDisk);

    rows.push(
      getConfigurationRowBase({
        className: "no-border-top custom-device-name",
        configuration: (
          <RenameDeviceInput
            name={formDisk.name}
            index={index}
            setName={(name) => {
              ensureEditMode(formik);
              void formik.setFieldValue(`devices.${index}.name`, name);
            }}
          />
        ),
        inherited: "",
        override: (
          <DetachDiskDeviceBtn
            onDetach={() => {
              ensureEditMode(formik);
              removeDevice(index, formik);
            }}
          />
        ),
      }),
    );

    rows.push(
      getConfigurationRowBase({
        className: "no-border-top inherited-with-form",
        configuration: (
          <Label forId={`devices.${index}.source`}>Source</Label>
        ),
        inherited: (
          <div className="custom-disk-volume-source">
            <Select
              name={`devices.${index}.source`}
              id={`devices.${index}.source`}
              onBlur={formik.handleBlur}
              onChange={(e) => {
                ensureEditMode(formik);
                void formik.setFieldValue(`devices.${index}.source`, e.target.value);
              }}
              value={formDisk.source}
              options={getSourceOptions()}
            />
          </div>
        ),
        override: "",
      }),
    );
  });

  return (
    <div className="custom-devices">
      {specialDisks.length > 0 && (
        <>
          <h2 className="p-heading--4 custom-devices-heading">
            Special disk devices
          </h2>
          <ConfigurationTable rows={rows} />
        </>
      )}
      <Button
        type="button"
        hasIcon
        onClick={() => {
          ensureEditMode(formik);
          addSpecialDisk();
        }}
      >
        <Icon name="plus" />
        <span>Attach special disk</span>
      </Button>
    </div>
  );
};

export default DiskDeviceFormSpecial;

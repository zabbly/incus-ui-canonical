import type { FC } from "react";
import {
  Button,
  Icon,
  Input,
  Label,
  Select,
} from "@canonical/react-components";
import type { FormikProps } from "formik/dist/types";
import type { NetworkLoadBalancerFormValues } from "pages/networks/forms/NetworkLoadBalancerForm";
import type { LxdNetwork } from "types/network";

export interface NetworkLoadBalancerBackendFormValues {
  name: string;
  targetAddress: string;
  targetPort: string;
}

interface Props {
  formik: FormikProps<NetworkLoadBalancerFormValues>;
  network?: LxdNetwork;
}

const NetworkLoadBalancerFormBackends: FC<Props> = ({ formik, network }) => {
  return (
    <table className="u-no-margin--bottom forward-backends">
      <thead>
        <tr>
          <th className="name">
            <Label
              required
              forId="backends.0.name"
              className="u-no-margin--bottom"
            >
              Name
            </Label>
          </th>
          <th className="target-address">
            <Label
              required
              forId="backends.0.targetAddress"
              className="u-no-margin--bottom"
            >
              Target address
            </Label>
          </th>
          <th className="target-port">
            <Label
              forId="backends.0.targetPort"
              className="u-no-margin--bottom"
            >
              Target port
            </Label>
          </th>
          <th className="u-off-screen">Actions</th>
        </tr>
      </thead>
      <tbody>
        {formik.values.backends.map((_backend, index) => {
          const backendError = formik.errors.backends?.[
            index
          ] as NetworkLoadBalancerBackendFormValues | null;

          return (
            <tr key={index}>
              <td className="name">
                <Input
                  {...formik.getFieldProps(`backends.${index}.name`)}
                  id={`backends.${index}.name`}
                  type="text"
                  aria-label={`Backend ${index} name`}
                  placeholder="Backend name"
                  error={
                    formik.touched.backends?.[index]?.name
                      ? backendError?.name
                      : undefined
                  }
                />
              </td>
              <td className="target-address">
                <Input
                  {...formik.getFieldProps(`backends.${index}.targetAddress`)}
                  id={`backends.${index}.targetAddress`}
                  type="text"
                  aria-label={`Backend ${index} target address`}
                  placeholder="Enter backend target address"
                  help={
                    index === formik.values.backends.length - 1 && (
                      <>
                        Must be from the network <b>{network?.name}</b>.
                      </>
                    )
                  }
                  error={
                    formik.touched.backends?.[index]?.targetAddress
                      ? backendError?.targetAddress
                      : undefined
                  }
                />
              </td>
              <td className="target-port">
                <Input
                  {...formik.getFieldProps(`backends.${index}.targetPort`)}
                  id={`backends.${index}.targetPort`}
                  type="text"
                  aria-label={`Backend ${index} target port`}
                  placeholder="Enter backend target port"
                  error={
                    formik.touched.backends?.[index]?.targetPort
                      ? backendError?.targetPort
                      : undefined
                  }
                />
              </td>
              <td>
                <Button
                  onClick={async () =>
                    formik.setFieldValue("backends", [
                      ...formik.values.backends.slice(0, index),
                      ...formik.values.backends.slice(index + 1),
                    ])
                  }
                  hasIcon
                  className="u-no-margin--bottom"
                  type="button"
                  aria-label={`Delete backend ${index}`}
                >
                  <Icon name="delete" />
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default NetworkLoadBalancerFormBackends;

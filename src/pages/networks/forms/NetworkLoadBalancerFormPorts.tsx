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

export interface NetworkLoadBalancerPortFormValues {
  listenPort: string;
  protocol: "tcp" | "udp";
  targetBackend: string;
}

interface Props {
  formik: FormikProps<NetworkLoadBalancerFormValues>;
  network?: LxdNetwork;
}

const NetworkLoadBalancerFormPorts: FC<Props> = ({ formik, network }) => {
  return (
    <table className="u-no-margin--bottom load-balancer-ports">
      <thead>
        <tr>
          <th className="listen-port">
            <Label
              required
              forId="ports.0.listenPort"
              className="u-no-margin--bottom"
            >
              Listen port
            </Label>
          </th>
          <th className="protocol">
            <Label
              required
              forId="ports.0.protocol"
              className="u-no-margin--bottom"
            >
              Protocol
            </Label>
          </th>
          <th className="target-backend">
            <Label
              required
              forId="ports.0.targetBackend"
              className="u-no-margin--bottom"
            >
              Target backend
            </Label>
          </th>
          <th className="u-off-screen">Actions</th>
        </tr>
      </thead>
      <tbody>
        {formik.values.ports.map((_port, index) => {
          const portError = formik.errors.ports?.[
            index
          ] as NetworkLoadBalancerPortFormValues | null;

          return (
            <tr key={index}>
              <td className="listen-port">
                <Input
                  {...formik.getFieldProps(`ports.${index}.listenPort`)}
                  id={`ports.${index}.listenPort`}
                  type="text"
                  aria-label={`Port ${index} listen port`}
                  placeholder="Port number(s)"
                  help={
                    index === formik.values.ports.length - 1 && (
                      <>e.g. 80,90-99.</>
                    )
                  }
                  error={
                    formik.touched.ports?.[index]?.listenPort
                      ? portError?.listenPort
                      : undefined
                  }
                />
              </td>
              <td className="protocol">
                <Select
                  {...formik.getFieldProps(`ports.${index}.protocol`)}
                  id={`ports.${index}.protocol`}
                  options={[
                    { label: "TCP", value: "tcp" },
                    { label: "UDP", value: "udp" },
                  ]}
                  aria-label={`Port ${index} protocol`}
                />
              </td>
              <td className="target-backend">
                <Input
                  {...formik.getFieldProps(`ports.${index}.targetBackend`)}
                  id={`ports.${index}.targetAddress`}
                  type="text"
                  aria-label={`Port ${index} target backends`}
                  placeholder="Enter target backend name(s)"
                  error={
                    formik.touched.ports?.[index]?.targetBackend
                      ? portError?.targetBackend
                      : undefined
                  }
                />
              </td>
              <td>
                <Button
                  onClick={async () =>
                    formik.setFieldValue("ports", [
                      ...formik.values.ports.slice(0, index),
                      ...formik.values.ports.slice(index + 1),
                    ])
                  }
                  hasIcon
                  className="u-no-margin--bottom"
                  type="button"
                  aria-label={`Delete port ${index}`}
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

export default NetworkLoadBalancerFormPorts;

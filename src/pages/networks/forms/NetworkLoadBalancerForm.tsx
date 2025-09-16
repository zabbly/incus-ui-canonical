import type { FC } from "react";
import { useEffect } from "react";
import {
  Button,
  Col,
  Form,
  Icon,
  Input,
  Label,
  Notification,
  RadioInput,
  Row,
  useListener,
  useNotify,
} from "@canonical/react-components";
import type { FormikProps } from "formik/dist/types";
import * as Yup from "yup";
import type { LxdNetwork, LxdNetworkLoadBalancer } from "types/network";
import { updateMaxHeight } from "util/updateMaxHeight";
import { testValidIp, testValidPort } from "util/networks";
import NotificationRow from "components/NotificationRow";
import type { NetworkLoadBalancerBackendFormValues } from "pages/networks/forms/NetworkLoadBalancerFormBackends";
import type { NetworkLoadBalancerPortFormValues } from "pages/networks/forms/NetworkLoadBalancerFormPorts";
import NetworkLoadBalancerFormBackends from "pages/networks/forms/NetworkLoadBalancerFormBackends";
import NetworkLoadBalancerFormPorts from "pages/networks/forms/NetworkLoadBalancerFormPorts";
import ScrollableForm from "components/ScrollableForm";
import { focusField } from "util/formFields";
import { bridgeType, ovnType } from "util/networks";

export const toNetworkLoadBalancer = (
  values: NetworkLoadBalancerFormValues,
): LxdNetworkLoadBalancer => {
  return {
    listen_address: values.listenAddress,
    description: values.description,
    ports: values.ports.map((port) => ({
      listen_port: port.listenPort?.toString(),
      protocol: port.protocol,
      target_backend: port.targetBackend
        ?.toString()
        .split(",")
        .map((item) => item.trim()),
    })),
    backends: values.backends.map((backend) => ({
      name: backend.name,
      target_address: backend.targetAddress?.toString(),
      target_port: backend.targetPort?.toString(),
    })),
  };
};

export const NetworkLoadBalancerSchema = Yup.object().shape({
  listenAddress: Yup.string()
    .test("valid-ip", "Invalid IP address", testValidIp)
    .required("Listen address is required"),
  ports: Yup.array().of(
    Yup.object().shape({
      listenPort: Yup.string()
        .test("valid-port", "Invalid port number", testValidPort)
        .required("Listen port required"),
      protocol: Yup.string().required("Protocol is required"),
      targetBackend: Yup.string().required("Target backend is required"),
    }),
  ),
  backends: Yup.array().of(
    Yup.object().shape({
      targetAddress: Yup.string()
        .test("valid-ip", "Invalid IP address", testValidIp)
        .required("Target address is required"),
      targetPort: Yup.string().test(
        "valid-port",
        "Invalid port number",
        testValidPort,
      ),
    }),
  ),
});

export interface NetworkLoadBalancerFormValues {
  listenAddress: string;
  description?: string;
  backends: NetworkLoadBalancerBackendFormValues[];
  ports: NetworkLoadBalancerPortFormValues[];
  location?: string;
}

interface Props {
  formik: FormikProps<NetworkLoadBalancerFormValues>;
  isEdit?: boolean;
  network?: LxdNetwork;
}

const NetworkLoadBalancerForm: FC<Props> = ({ formik, isEdit, network }) => {
  const notify = useNotify();

  const updateFormHeight = () => {
    updateMaxHeight("form-contents", "p-bottom-controls");
  };
  useEffect(updateFormHeight, [notify.notification?.message]);
  useListener(window, updateFormHeight, "resize", true);

  const addBackend = () => {
    formik.setFieldValue("backends", [...formik.values.backends, {}]);

    const name = `backends.${formik.values.backends.length}.name`;
    focusField(name);
  };

  const addPort = () => {
    formik.setFieldValue("ports", [
      ...formik.values.ports,
      {
        protocol: "tcp",
      },
    ]);

    const name = `ports.${formik.values.ports.length}.listenPort`;
    focusField(name);
  };

  return (
    <Form
      className="form network-load-balancers-form"
      onSubmit={formik.handleSubmit}
    >
      <Row className="form-contents">
        <Col size={12}>
          <ScrollableForm>
            {/* hidden submit to enable enter key in inputs */}
            <Input type="submit" hidden value="Hidden input" />
            <Row className="p-form__group p-form-validation">
              <NotificationRow />
              <Notification
                severity="information"
                title="Network information"
                titleElement="h2"
              >
                Name: {network?.name}
                <br />
                {network?.config["ipv4.address"] && (
                  <>
                    IPv4: {network?.config["ipv4.address"]}
                    <br />
                  </>
                )}
                {network?.config["ipv6.address"] && (
                  <>IPv6: {network?.config["ipv6.address"]}</>
                )}
              </Notification>
            </Row>
            <Row>
              <Col size={4}>
                <Label forId="listenAddress">Listen address</Label>
              </Col>
              <Col size={8}>
                <Input
                  {...formik.getFieldProps("listenAddress")}
                  id="listenAddress"
                  type="text"
                  placeholder="Enter IP address"
                  autoFocus
                  required
                  disabled={isEdit}
                  help={
                    isEdit
                      ? "Listen address can't be changed after creation."
                      : "Any address routed to Incus."
                  }
                  error={
                    formik.touched.listenAddress
                      ? formik.errors.listenAddress
                      : undefined
                  }
                />
              </Col>
            </Row>
            <Input
              {...formik.getFieldProps("description")}
              id="description"
              type="text"
              label="Description"
              placeholder="Enter description"
              stacked
            />
            {formik.values.backends.length > 0 && (
              <NetworkLoadBalancerFormBackends
                formik={formik}
                network={network}
              />
            )}
            <Row>
              <Col size={12}>
                <Button hasIcon onClick={addBackend} type="button">
                  <Icon name="plus" />
                  <span>Add backend</span>
                </Button>
              </Col>
            </Row>
            {formik.values.ports.length > 0 && (
              <NetworkLoadBalancerFormPorts formik={formik} network={network} />
            )}
            <Row>
              <Col size={12}>
                <Button hasIcon onClick={addPort} type="button">
                  <Icon name="plus" />
                  <span>Add port</span>
                </Button>
              </Col>
            </Row>
          </ScrollableForm>
        </Col>
      </Row>
    </Form>
  );
};

export default NetworkLoadBalancerForm;

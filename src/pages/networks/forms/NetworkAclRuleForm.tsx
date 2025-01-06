import { FC, useEffect, useRef } from "react";
import {
  Col,
  Form,
  Input,
  Label,
  Notification,
  Row,
  Select,
  useNotify,
} from "@canonical/react-components";
import { FormikProps } from "formik/dist/types";
import * as Yup from "yup";
import { LxdNetworkAcl } from "types/network";
import { updateMaxHeight } from "util/updateMaxHeight";
import useEventListener from "@use-it/event-listener";
import NotificationRow from "components/NotificationRow";
import ScrollableForm from "components/ScrollableForm";

export const toNetworkAclRule = (
  values: NetworkAclRuleFormValues,
): LxdNetworkAclRule => {
  return {
    action: values.action,
    state: values.state,
    description: values.description,
    source: values.source,
    destination: values.destination,
    protocol: values.protocol,
    source_port: values.sourcePort,
    destination_port: values.destinationPort,
    icmp_type: values.icmpType,
    icmp_ode: values.icmpCode,
  };
};

export const NetworkAclRuleSchema = Yup.object().shape({
});

export interface NetworkAclRuleFormValues {
  readOnly: boolean;
  isCreating: boolean;
  action: string;
  state: string;
  description?: string;
  source?: string;
  destination?: string;
  protocol?: string;
  sourcePort?: string;
  destinationPort?: string;
  icmpType?: string;
  icmpCode?: string;
  yaml?: string;
}

interface Props {
  formik: FormikProps<NetworkAclFormValues>;
  acl?: LxdNetworkAcl;
  showNotify: boolean;
}

const NetworkAclRuleForm: FC<Props> = ({ formik, acl, showNotify }) => {
  const notify = useNotify();
  const divNotifyRef = useRef<HTMLDivElement | null>(null);

  const updateFormHeight = () => {
    updateMaxHeight("form-contents", "p-bottom-controls");
  };
  useEffect(updateFormHeight, [notify.notification?.message]);
  useEventListener("resize", updateFormHeight);
  useEffect(() => {
      divNotifyRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [showNotify]);

  return (
    <Form className="form network-forwards-form" onSubmit={formik.handleSubmit}>
      <Row className="form-contents">
        <Col size={12}>
          <ScrollableForm>
            {/* hidden submit to enable enter key in inputs */}
            <Input type="submit" hidden value="Hidden input" />
            <div ref={divNotifyRef}>
              <Row className="p-form__group p-form-validation">
                <NotificationRow />
              </Row>
            </div>
            <Select
              {...formik.getFieldProps("action")}
              options={[
                {
                  label: "allow",
                  value: "allow",
                },
                {
                  label: "allow-stateless",
                  value: "allow-stateless",
                },
                {
                  label: "reject",
                  value: "reject",
                },
                {
                  label: "drop",
                  value: "drop",
                },
              ]}
              onChange={ formik.handleChange }
              label="Action"
              help="Action to take for matching traffic"
              required
              disabled={formik.values.readOnly || !formik.values.isCreating}
            />
            <Select
              {...formik.getFieldProps("state")}
              options={[
                {
                  label: "enabled",
                  value: "enaled",
                },
                {
                  label: "disabled",
                  value: "disabled",
                },
                {
                  label: "logged",
                  value: "logged",
                },
              ]}
              onChange={ formik.handleChange }
              label="State"
              help="State of the rule"
              required
              disabled={formik.values.readOnly || !formik.values.isCreating}
            />
            <Input
              {...formik.getFieldProps("description")}
              id="description"
              type="text"
              label="Description"
              placeholder="Enter description"
            />
            <Input
              {...formik.getFieldProps("source")}
              id="source"
              type="text"
              label="Source"
            />
            <Input
              {...formik.getFieldProps("destination")}
              id="destination"
              type="text"
              label="Destination"
            />
            <Select
              {...formik.getFieldProps("protocol")}
              options={[
                {
                  label: "",
                  value: "",
                },
                {
                  label: "icmp4",
                  value: "icmp4",
                },
                {
                  label: "icmp6",
                  value: "icmp6",
                },
                {
                  label: "tcp",
                  value: "tcp",
                },
                {
                  label: "udp",
                  value: "udp",
                },
              ]}
              onChange={ formik.handleChange }
              label="Protocol"
              disabled={formik.values.readOnly || !formik.values.isCreating}
            />
            <Input
              {...formik.getFieldProps("sourcePort")}
              id="sourcePort"
              type="text"
              label="Source port"
            />
            <Input
              {...formik.getFieldProps("destinationPort")}
              id="destinationPort"
              type="text"
              label="Destination port"
            />
            <Input
              {...formik.getFieldProps("icmpType")}
              id="icmpType"
              type="text"
              label="ICMP type"
            />
            <Input
              {...formik.getFieldProps("icmpCode")}
              id="icmpCode"
              type="text"
              label="ICMP code"
            />
          </ScrollableForm>
        </Col>
      </Row>
    </Form>
  );
};

export default NetworkAclRuleForm;

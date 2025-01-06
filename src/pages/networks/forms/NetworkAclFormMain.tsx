import { FC, ReactNode } from "react";
import { Col, Input, Row } from "@canonical/react-components";
import { FormikProps } from "formik/dist/types";
import { NetworkAclFormValues } from "pages/networks/forms/NetworkAclForm";
import AutoExpandingTextArea from "components/AutoExpandingTextArea";
import ScrollableForm from "components/ScrollableForm";
import { ensureEditMode } from "util/instanceEdit";

interface Props {
  formik: FormikProps<NetworkAclFormValues>;
}

const NetworkAclFormMain: FC<Props> = ({ formik }) => {
  const getFormProps = (id: "name" | "description") => {
    return {
      id: id,
      name: id,
      onBlur: formik.handleBlur,
      onChange: (e: unknown) => {
        ensureEditMode(formik);
        formik.handleChange(e);
      },
      value: formik.values[id] ?? "",
      error: formik.touched[id] ? (formik.errors[id] as ReactNode) : null,
      placeholder: `Enter ${id.replaceAll("_", " ")}`,
    };
  };

  return (
    <ScrollableForm>
      <Row>
        <Col size={12}>
          <Input
            {...getFormProps("name")}
            type="text"
            label="Name"
            required
            disabled={formik.values.readOnly || !formik.values.isCreating}
            help={
              !formik.values.isCreating
                ? "Click the name in the header to rename the network ACL"
                : undefined
            }
          />
          <AutoExpandingTextArea
            {...getFormProps("description")}
            label="Description"
          />
        </Col>
      </Row>
    </ScrollableForm>
  );
};

export default NetworkAclFormMain;

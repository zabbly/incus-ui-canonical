import { FC, useEffect } from "react";
import { Col, Form, Input, Row, useNotify } from "@canonical/react-components";
import { LxdNetworkAcl } from "types/network";
import NetworkAclFormMenu, {
  MAIN_CONFIGURATION,
  YAML_CONFIGURATION,
} from "pages/networks/forms/NetworkAclFormMenu";
import { FormikProps } from "formik/dist/types";
import { updateMaxHeight } from "util/updateMaxHeight";
import useEventListener from "util/useEventListener";
import YamlForm from "components/forms/YamlForm";
import NetworkAclFormMain from "pages/networks/forms/NetworkAclFormMain";
import { slugify } from "util/slugify";
import { useDocs } from "context/useDocs";
import YamlNotification from "components/forms/YamlNotification";
import { ensureEditMode } from "util/instanceEdit";

export interface NetworkAclFormValues {
  readOnly: boolean;
  isCreating: boolean;
  name: string;
  description?: string;
  parent?: string;
  yaml?: string;
  entityType: "networkAcl";
}

export const toNetworkAcl = (
  values: NetworkAclFormValues,
): Partial<LxdNetworkAcl> => {
  return {
    name: values.name,
    description: values.description,
  };
};

interface Props {
  formik: FormikProps<NetworkAclFormValues>;
  getYaml: () => string;
  section: string;
  setSection: (section: string) => void;
  version?: number;
}

const NetworkAclForm: FC<Props> = ({
  formik,
  getYaml,
  section,
  setSection,
  version = 0,
}) => {
  const docBaseLink = useDocs();
  const notify = useNotify();

  const updateFormHeight = () => {
    updateMaxHeight("form-contents", "p-bottom-controls");
  };
  useEffect(updateFormHeight, [notify.notification?.message, section]);
  useEventListener("resize", updateFormHeight);

  return (
    <Form className="form network-form" onSubmit={formik.handleSubmit}>
      {/* hidden submit to enable enter key in inputs */}
      <Input type="submit" hidden value="Hidden input" />
      {section !== slugify(YAML_CONFIGURATION) && (
        <NetworkAclFormMenu active={section} setActive={setSection} />
      )}
      <Row className="form-contents" key={section}>
        <Col size={12}>
          {section === slugify(MAIN_CONFIGURATION) && (
            <NetworkAclFormMain formik={formik} />
          )}
          {section === slugify(YAML_CONFIGURATION) && (
            <YamlForm
              key={`yaml-form-${version}`}
              yaml={getYaml()}
              setYaml={(yaml) => {
                ensureEditMode(formik);
                void formik.setFieldValue("yaml", yaml);
              }}
            >
              <YamlNotification
                entity="network-acl"
                href={`${docBaseLink}/explanation/networks/#managed-networks`}
              />
            </YamlForm>
          )}
        </Col>
      </Row>
    </Form>
  );
};

export default NetworkAclForm;

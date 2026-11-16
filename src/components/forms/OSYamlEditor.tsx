import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { ActionButton, Button, useListener } from "@canonical/react-components";
import {
  MAIN_CONFIGURATION,
  YAML_CONFIGURATION,
} from "pages/instances/forms/InstanceFormMenu";
import type { YamlFormValues } from "types/forms/instanceAndProfile";
import YamlForm from "components/forms/YamlForm";
import FormFooterLayout from "components/forms/FormFooterLayout";
import YamlSwitch from "components/forms/YamlSwitch";
import OSInfoView from "pages/os/info/OSInfoView";
import type { IncusOSConfig } from "types/os";
import { updateMaxHeight } from "util/updateMaxHeight";
import { objectToYaml } from "util/yaml";

interface Props {
  yamlData?: IncusOSConfig;
  // Formatted view shown in place of the raw YAML.
  info?: ReactNode;
  onSubmit: (
    values: YamlFormValues,
    handleSuccess: () => void,
    handleFailure: () => void,
  ) => void;
}

const OSYamlEditor: FC<Props> = ({ yamlData, info, onSubmit }) => {
  const [section, setSection] = useState(MAIN_CONFIGURATION);
  const [version, setVersion] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  const updateFormHeight = () => {
    updateMaxHeight("yaml-code", "p-bottom-controls", 20);
  };

  useEffect(updateFormHeight);
  useListener(window, updateFormHeight, "resize", true);

  const formik = useFormik<YamlFormValues>({
    initialValues: {
      yaml: undefined,
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      onSubmit(values, handleSuccess, handleFailure);
    },
  });

  const handleSuccess = () => {
    void formik.setFieldValue("yaml", undefined);
    setShowButtons(false);
    formik.setSubmitting(false);
  };

  const handleFailure = () => {
    formik.setSubmitting(false);
  };

  const getYaml = () => {
    return objectToYaml(yamlData?.config ?? {});
  };

  const updateSection = (newItem: string) => {
    if (newItem === MAIN_CONFIGURATION) {
      setShowButtons(false);
    }

    setSection(newItem);
  };

  return (
    <div className="edit-instance">
      {section === MAIN_CONFIGURATION && info && (
        <OSInfoView yamlData={yamlData} hasFooter>
          {info}
        </OSInfoView>
      )}
      {section === MAIN_CONFIGURATION && !info && (
        <pre className="yaml-code">
          <code>{objectToYaml(yamlData ?? {})}</code>
        </pre>
      )}
      {section === YAML_CONFIGURATION && (
        <YamlForm
          key={`yaml-form-${version}`}
          yaml={getYaml()}
          setYaml={(yaml) => {
            setShowButtons(true);
            formik.setFieldValue("yaml", yaml);
          }}
        ></YamlForm>
      )}
      <FormFooterLayout>
        <YamlSwitch
          formik={formik}
          section={section}
          setSection={updateSection}
        />
        {showButtons && (
          <>
            <Button
              appearance="base"
              onClick={() => {
                setVersion((old) => old + 1);
                void formik.setFieldValue("yaml", undefined);
                setShowButtons(false);
              }}
            >
              Cancel
            </Button>
            <ActionButton
              appearance="positive"
              loading={formik.isSubmitting}
              disabled={!formik.isValid || formik.isSubmitting}
              onClick={() => void formik.submitForm()}
            >
              Save changes
            </ActionButton>
          </>
        )}
      </FormFooterLayout>
    </div>
  );
};

export default OSYamlEditor;

import { FC, useState } from "react";
import { Button, useNotify } from "@canonical/react-components";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { checkDuplicateName } from "util/helpers";
import { updateNetworkAcl } from "api/networks";
import NetworkAclForm, {
  NetworkAclFormValues,
  toNetworkAcl,
} from "pages/networks/forms/NetworkAclForm";
import { LxdNetworkAcl } from "types/network";
import { yamlToObject } from "util/yaml";
import { dump as dumpYaml } from "js-yaml";
import { toNetworkAclFormValues } from "util/networkForm";
import { slugify } from "util/slugify";
import { useNavigate, useParams } from "react-router-dom";
import {
  MAIN_CONFIGURATION,
  YAML_CONFIGURATION,
} from "pages/networks/forms/NetworkAclFormMenu";
import FormFooterLayout from "components/forms/FormFooterLayout";
import { useToastNotification } from "context/toastNotificationProvider";
import YamlSwitch from "components/forms/YamlSwitch";
import FormSubmitBtn from "components/forms/FormSubmitBtn";
import ResourceLink from "components/ResourceLink";

interface Props {
  acl: LxdNetworkAcl;
  project: string;
}

const EditNetworkAcl: FC<Props> = ({ acl, project }) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const toastNotify = useToastNotification();

  const { section } = useParams<{ section?: string }>();
  const queryClient = useQueryClient();
  const controllerState = useState<AbortController | null>(null);
  const [version, setVersion] = useState(0);

  const NetworkAclSchema = Yup.object().shape({
    name: Yup.string()
      .test(
        "deduplicate",
        "A network ACL with this name already exists",
        (value) =>
          value === acl.name ||
          checkDuplicateName(value, project, controllerState, "network-acls"),
      )
      .required("Network ACL name is required"),
  });

  const formik = useFormik<NetworkAclFormValues>({
    initialValues: toNetworkAclFormValues(acl),
    validationSchema: NetworkAclSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      const yaml = values.yaml ? values.yaml : getYaml();
      const saveAcl = yamlToObject(yaml) as LxdNetworkAcl;
      updateNetworkAcl({ ...saveAcl, etag: acl.etag }, project)
        .then(() => {
          formik.resetForm({
            values: toNetworkAclFormValues(saveAcl),
          });

          void queryClient.invalidateQueries({
            queryKey: [
              queryKeys.projects,
              project,
              queryKeys.networkAcls,
              acl.name,
            ],
          });
          toastNotify.success(
            <>
              Network ACL{""}
              <ResourceLink
                type="network-acl"
                value={acl.name}
                to={`/ui/project/${project}/network-acls/${acl.name}`}
              />{" "}
              updated.
            </>,
          );
        })
        .catch((e) => {
          notify.failure("Network ACL update failed", e);
        })
        .finally(() => formik.setSubmitting(false));
    },
  });

  const getYaml = () => {
    return dumpYaml(toNetworkAcl(formik.values));
  };

  const setSection = (newSection: string) => {
    const baseUrl = `/ui/project/${project}/network-acls/${acl.name}/configuration`;
    newSection === MAIN_CONFIGURATION
      ? navigate(baseUrl)
      : navigate(`${baseUrl}/${slugify(newSection)}`);
  };

  const readOnly = formik.values.readOnly;

  return (
    <>
      <NetworkAclForm
        formik={formik}
        getYaml={getYaml}
        section={section ?? slugify(MAIN_CONFIGURATION)}
        setSection={setSection}
        version={version}
      />
      <FormFooterLayout>
        <YamlSwitch
          formik={formik}
          section={section}
          setSection={setSection}
          disableReason={
            formik.values.name
              ? undefined
              : "Please enter a network ACL name to enable this section"
          }
        />
        {readOnly ? null : (
          <>
            <Button
              appearance="base"
              onClick={() => {
                setVersion((old) => old + 1);
                void formik.setValues(toNetworkAclFormValues(acl));
              }}
            >
              Cancel
            </Button>
            <FormSubmitBtn
              formik={formik}
              isYaml={section === slugify(YAML_CONFIGURATION)}
              disabled={!formik.values.name}
            />
          </>
        )}
      </FormFooterLayout>
    </>
  );
};

export default EditNetworkAcl;

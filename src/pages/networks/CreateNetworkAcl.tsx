import { FC, useState } from "react";
import { ActionButton, Button, useNotify } from "@canonical/react-components";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { useNavigate, useParams } from "react-router-dom";
import { checkDuplicateName } from "util/helpers";
import { createNetworkAcl } from "api/networks";
import NetworkAclForm, {
  NetworkAclFormValues,
  toNetworkAcl,
} from "pages/networks/forms/NetworkAclForm";
import NotificationRow from "components/NotificationRow";
import { yamlToObject } from "util/yaml";
import { dump as dumpYaml } from "js-yaml";
import BaseLayout from "components/BaseLayout";
import { MAIN_CONFIGURATION } from "pages/networks/forms/NetworkAclFormMenu";
import { slugify } from "util/slugify";
import FormFooterLayout from "components/forms/FormFooterLayout";
import { useToastNotification } from "context/toastNotificationProvider";
import YamlSwitch from "components/forms/YamlSwitch";
import ResourceLink from "components/ResourceLink";

const CreateNetworkAcl: FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const { project } = useParams<{ project: string }>();
  const [section, setSection] = useState(slugify(MAIN_CONFIGURATION));
  const controllerState = useState<AbortController | null>(null);

  if (!project) {
    return <>Missing project</>;
  }

  const NetworkAclSchema = Yup.object().shape({
    name: Yup.string()
      .test("deduplicate", "A network ACL with this name already exists", (value) =>
        checkDuplicateName(value, project, controllerState, "network-acls"),
      )
      .required("Network ACL name is required"),
  });

  const formik = useFormik<NetworkAclFormValues>({
    initialValues: {
      readOnly: false,
      isCreating: true,
      name: "",
      entityType: "networkAcl",
    },
    validationSchema: NetworkAclSchema,
    onSubmit: (values) => {
      const acl = values.yaml
        ? yamlToObject(values.yaml)
        : toNetworkAcl(values);

      createNetworkAcl(acl, project)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [queryKeys.projects, project, queryKeys.networkAcls],
          });
          navigate(`/ui/project/${project}/network-acls`);
          toastNotify.success(
            <>
              Network ACL{" "}
              <ResourceLink
                type="network-acl"
                value={values.name}
                to={`/ui/project/${project}/network-acls/${values.name}`}
              />{" "}
              created.
            </>,
          );
        })
        .catch((e) => {
          formik.setSubmitting(false);
          notify.failure("Network ACL creation failed", e);
        });
    },
  });

  const getYaml = () => {
    const payload = toNetworkAcl(formik.values);
    return dumpYaml(payload);
  };

  const updateSection = (newSection: string) => {
    setSection(slugify(newSection));
  };

  return (
    <BaseLayout title="Create a network ACL" contentClassName="create-network">
      <NotificationRow />
      <NetworkAclForm
        formik={formik}
        getYaml={getYaml}
        project={project}
        section={section}
        setSection={updateSection}
      />
      <FormFooterLayout>
        <div className="yaml-switch">
          <YamlSwitch
            formik={formik}
            section={section}
            setSection={updateSection}
            disableReason={
              formik.values.name
                ? undefined
                : "Please enter a network ACL name to enable this section"
            }
          />
        </div>
        <Button
          appearance="base"
          onClick={() => navigate(`/ui/project/${project}/network-acls`)}
        >
          Cancel
        </Button>
        <ActionButton
          appearance="positive"
          loading={formik.isSubmitting}
          disabled={
            !formik.isValid || !formik.values.name
          }
          onClick={() => void formik.submitForm()}
        >
          Create
        </ActionButton>
      </FormFooterLayout>
    </BaseLayout>
  );
};

export default CreateNetworkAcl;

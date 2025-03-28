import { FC, useEffect, useState } from "react";
import { Button, Col, Form, Row } from "@canonical/react-components";
import { useFormik } from "formik";
import { updateInstance } from "api/instances";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { dump as dumpYaml } from "js-yaml";
import { yamlToObject } from "util/yaml";
import { useNavigate, useParams } from "react-router-dom";
import { LxdInstance } from "types/instance";
import { FormDeviceValues } from "util/formDevices";
import SecurityPoliciesForm, {
  SecurityPoliciesFormValues,
} from "components/forms/SecurityPoliciesForm";
import InstanceSnapshotsForm, {
  SnapshotFormValues,
} from "components/forms/InstanceSnapshotsForm";
import CloudInitForm, {
  CloudInitFormValues,
} from "components/forms/CloudInitForm";
import ResourceLimitsForm, {
  ResourceLimitsFormValues,
} from "components/forms/ResourceLimitsForm";
import YamlForm, { YamlFormValues } from "components/forms/YamlForm";
import EditInstanceDetails from "pages/instances/forms/EditInstanceDetails";
import InstanceFormMenu, {
  BOOT,
  CLOUD_INIT,
  DISK_DEVICES,
  MAIN_CONFIGURATION,
  MIGRATION,
  NETWORK_DEVICES,
  RESOURCE_LIMITS,
  SECURITY_POLICIES,
  SNAPSHOTS,
  YAML_CONFIGURATION,
  GPU_DEVICES,
  OTHER_DEVICES,
  PROXY_DEVICES,
} from "pages/instances/forms/InstanceFormMenu";
import useEventListener from "util/useEventListener";
import { updateMaxHeight } from "util/updateMaxHeight";
import DiskDeviceForm from "components/forms/DiskDeviceForm";
import NetworkDevicesForm from "components/forms/NetworkDevicesForm";
import {
  ensureEditMode,
  getInstanceEditValues,
  getInstancePayload,
  InstanceEditSchema,
} from "util/instanceEdit";
import { slugify } from "util/slugify";
import { useEventQueue } from "context/eventQueue";
import { hasDiskError, hasNetworkError } from "util/instanceValidation";
import FormFooterLayout from "components/forms/FormFooterLayout";
import { useToastNotification } from "context/toastNotificationProvider";
import { useDocs } from "context/useDocs";
import MigrationForm, {
  MigrationFormValues,
} from "components/forms/MigrationForm";
import GPUDeviceForm from "components/forms/GPUDeviceForm";
import OtherDeviceForm from "components/forms/OtherDeviceForm";
import YamlSwitch from "components/forms/YamlSwitch";
import YamlNotification from "components/forms/YamlNotification";
import ProxyDeviceForm from "components/forms/ProxyDeviceForm";
import FormSubmitBtn from "components/forms/FormSubmitBtn";
import InstanceLinkChip from "./InstanceLinkChip";
import BootForm, { BootFormValues } from "components/forms/BootForm";

export interface InstanceEditDetailsFormValues {
  name: string;
  description?: string;
  instanceType: string;
  location: string;
  profiles: string[];
  entityType: "instance";
  isCreating: boolean;
  readOnly: boolean;
}

export type EditInstanceFormValues = InstanceEditDetailsFormValues &
  FormDeviceValues &
  ResourceLimitsFormValues &
  SecurityPoliciesFormValues &
  SnapshotFormValues &
  MigrationFormValues &
  BootFormValues &
  CloudInitFormValues &
  YamlFormValues;

interface Props {
  instance: LxdInstance;
}

const EditInstance: FC<Props> = ({ instance }) => {
  const docBaseLink = useDocs();
  const eventQueue = useEventQueue();
  const toastNotify = useToastNotification();
  const { project, section } = useParams<{
    project: string;
    section?: string;
  }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  if (!project) {
    return <>Missing project</>;
  }

  const updateFormHeight = () => {
    updateMaxHeight("form-contents", "p-bottom-controls");
  };
  useEffect(updateFormHeight, [section]);
  useEventListener("resize", updateFormHeight);

  const formik = useFormik<EditInstanceFormValues>({
    initialValues: getInstanceEditValues(instance),
    validationSchema: InstanceEditSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      const instancePayload = (
        values.yaml
          ? yamlToObject(values.yaml)
          : getInstancePayload(instance, values)
      ) as LxdInstance;

      // ensure the etag is set (it is missing on the yaml)
      instancePayload.etag = instance.etag;
      const instanceLink = <InstanceLinkChip instance={instance} />;

      void updateInstance(instancePayload, project)
        .then((operation) => {
          eventQueue.set(
            operation.metadata.id,
            () => {
              toastNotify.success(<>Instance {instanceLink} updated.</>);
              void formik.setValues(getInstanceEditValues(instancePayload));
            },
            (msg) =>
              toastNotify.failure(
                "Instance update failed.",
                new Error(msg),
                instanceLink,
              ),
            () => {
              formik.setSubmitting(false);
              void queryClient.invalidateQueries({
                queryKey: [queryKeys.instances],
              });
            },
          );
        })
        .catch((e) => {
          formik.setSubmitting(false);
          toastNotify.failure("Instance update failed.", e, instanceLink);
        });
    },
  });

  const updateSection = (newSection: string) => {
    if (Boolean(formik.values.yaml) && newSection !== YAML_CONFIGURATION) {
      void formik.setFieldValue("yaml", undefined);
    }

    const baseUrl = `/ui/project/${project}/instance/${instance.name}/configuration`;
    if (newSection === MAIN_CONFIGURATION) {
      navigate(baseUrl);
    } else {
      navigate(`${baseUrl}/${slugify(newSection)}`);
    }
  };

  const getYaml = () => {
    const exclude = new Set([
      "backups",
      "snapshots",
      "state",
      "expanded_config",
      "expanded_devices",
      "etag",
    ]);
    const bareInstance = Object.fromEntries(
      Object.entries(instance).filter((e) => !exclude.has(e[0])),
    );
    return dumpYaml(bareInstance);
  };

  const readOnly = formik.values.readOnly;

  return (
    <div className="edit-instance">
      <Form onSubmit={formik.handleSubmit} className="form">
        {section !== slugify(YAML_CONFIGURATION) && (
          <InstanceFormMenu
            active={section ?? slugify(MAIN_CONFIGURATION)}
            setActive={updateSection}
            isDisabled={false}
            hasDiskError={hasDiskError(formik)}
            hasNetworkError={hasNetworkError(formik)}
          />
        )}
        <Row className="form-contents" key={section}>
          <Col size={12}>
            {(section === slugify(MAIN_CONFIGURATION) || !section) && (
              <EditInstanceDetails formik={formik} project={project} />
            )}

            {section === slugify(DISK_DEVICES) && (
              <DiskDeviceForm formik={formik} project={project} />
            )}

            {section === slugify(NETWORK_DEVICES) && (
              <NetworkDevicesForm formik={formik} project={project} />
            )}

            {section === slugify(GPU_DEVICES) && (
              <GPUDeviceForm formik={formik} project={project} />
            )}

            {section === slugify(PROXY_DEVICES) && (
              <ProxyDeviceForm formik={formik} project={project} />
            )}

            {section === slugify(OTHER_DEVICES) && (
              <OtherDeviceForm formik={formik} project={project} />
            )}

            {section === slugify(RESOURCE_LIMITS) && (
              <ResourceLimitsForm formik={formik} />
            )}

            {section === slugify(SECURITY_POLICIES) && (
              <SecurityPoliciesForm formik={formik} />
            )}

            {section === slugify(SNAPSHOTS) && (
              <InstanceSnapshotsForm formik={formik} />
            )}

            {section === slugify(MIGRATION) && (
              <MigrationForm formik={formik} />
            )}

            {section === slugify(BOOT) && <BootForm formik={formik} />}

            {section === slugify(CLOUD_INIT) && (
              <CloudInitForm key={`yaml-form-${version}`} formik={formik} />
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
                  entity="instance"
                  href={`${docBaseLink}/instances`}
                />
              </YamlForm>
            )}
          </Col>
        </Row>
      </Form>
      <FormFooterLayout>
        <YamlSwitch
          formik={formik}
          section={section}
          setSection={updateSection}
        />
        {readOnly ? null : (
          <>
            <Button
              appearance="base"
              onClick={() => {
                void formik.setValues(getInstanceEditValues(instance));
                setVersion((old) => old + 1);
              }}
            >
              Cancel
            </Button>
            <FormSubmitBtn
              formik={formik}
              isYaml={section === slugify(YAML_CONFIGURATION)}
              disabled={hasDiskError(formik) || hasNetworkError(formik)}
            />
          </>
        )}
      </FormFooterLayout>
    </div>
  );
};

export default EditInstance;

import { FC, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { ActionButton, useNotify } from "@canonical/react-components";
import { useFormik } from "formik";
import NetworkAclRuleForm, {
  NetworkAclRuleFormValues,
  NetworkAclRuleSchema,
  toNetworkAclRule,
} from "pages/networks/forms/NetworkAclRuleForm";
import { Link, useNavigate, useParams } from "react-router-dom";
import BaseLayout from "components/BaseLayout";
import Loader from "components/Loader";
import { useDocs } from "context/useDocs";
import HelpLink from "components/HelpLink";
import FormFooterLayout from "components/forms/FormFooterLayout";
import { useToastNotification } from "context/toastNotificationProvider";
import { fetchNetworkAcl, updateNetworkAcl } from "api/networks";
import { LxdNetworkAcl, LxdNetworkAclRule, LxdNetworkAclRuleType } from "types/network";

const CreateNetworkAclRule: FC = () => {
  const docBaseLink = useDocs();
  const navigate = useNavigate();
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const [showNotify, setShowNotify] = useState(false);
  const {
    acl: aclName,
    project,
    type,
  } = useParams<{
    acl: string;
    project: string;
    type: string;
  }>();

  const {
    data: acl,
    error,
    isLoading,
  } = useQuery({
    queryKey: [queryKeys.projects, project, queryKeys.networkAcls, aclName],
    queryFn: () => fetchNetworkAcl(aclName as string, project as string),
  });

  if (error) {
    notify.failure("Loading network ACL failed", error);
  }

  const ruleType: keyof LxdNetworkAcl = type as LxdNetworkAclRuleType;

  const formik = useFormik<NetworkAclRuleFormValues>({
    initialValues: {
      readOnly: false,
      isCreating: true,
      action: "allow",
      state: "enabled",
    },
    validationSchema: NetworkAclRuleSchema,
    onSubmit: (values) => {
      const rule = toNetworkAclRule(values);
      const aclObj = acl as LxdNetworkAcl;
      const tmpAcl = {
        ...aclObj,
        ingress:[...aclObj.ingress as LxdNetworkAclRule[]],
        egress:[...aclObj.egress as LxdNetworkAclRule[]],
      };
      tmpAcl[ruleType].push(rule);
      updateNetworkAcl({ ...tmpAcl, etag: tmpAcl.etag }, project as string)
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              queryKeys.projects,
              project,
              queryKeys.networkAcls,
              aclObj.name,
            ],
          });
          navigate(`/ui/project/${project}/network-acls/${aclName}/${type}`);
          toastNotify.success(<>Network ACL rule added.</>);
        })
        .catch((e) => {
          notify.failure("Network ACL rule update failed", e);
          setShowNotify(!showNotify);
        })
        .finally(() => formik.setSubmitting(false));
    },
  });

  if (isLoading) {
    return <Loader text="Loading network ACL..." />;
  }

  return (
    <BaseLayout
      title={
        <HelpLink
          href={`${docBaseLink}/howto/network_acls/`}
          title="Learn more about network ACLs"
        >
          Create a network ACL rule
        </HelpLink>
      }
      contentClassName="create-network"
    >
      <NetworkAclRuleForm formik={formik} showNotify={showNotify} />
      <FormFooterLayout>
        <Link
          className="p-button--base"
          to={`/ui/project/${project}/network-acls/${aclName}/${type}`}
        >
          Cancel
        </Link>
        <ActionButton
          loading={formik.isSubmitting}
          disabled={!formik.isValid}
          onClick={() => void formik.submitForm()}
        >
          Create
        </ActionButton>
      </FormFooterLayout>
    </BaseLayout>
  );
};

export default CreateNetworkAclRule;

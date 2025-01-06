import { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RenameHeader, { RenameHeaderValues } from "components/RenameHeader";
import { useFormik } from "formik";
import * as Yup from "yup";
import { checkDuplicateName } from "util/helpers";
import { LxdNetworkAcl } from "types/network";
import { renameNetworkAcl } from "api/networks";
import DeleteNetworkAclBtn from "pages/networks/actions/DeleteNetworkAclBtn";
import { useNotify } from "@canonical/react-components";
import { useToastNotification } from "context/toastNotificationProvider";
import ResourceLink from "components/ResourceLink";

interface Props {
  name: string;
  acl?: LxdNetworkAcl;
  project: string;
}

const NetworkAclDetailHeader: FC<Props> = ({ name, acl, project }) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const controllerState = useState<AbortController | null>(null);

  const RenameSchema = Yup.object().shape({
    name: Yup.string()
      .test(
        "deduplicate",
        "A network ACL with this name already exists",
        (value) =>
          acl?.name === value ||
          checkDuplicateName(value, project, controllerState, "network-acls"),
      )
      .required("Network ACL name is required"),
  });

  const formik = useFormik<RenameHeaderValues>({
    initialValues: {
      name,
      isRenaming: false,
    },
    validationSchema: RenameSchema,
    onSubmit: (values) => {
      if (name === values.name) {
        void formik.setFieldValue("isRenaming", false);
        formik.setSubmitting(false);
        return;
      }
      renameNetworkAcl(name, values.name, project)
        .then(() => {
          const url = `/ui/project/${project}/network-acls/${values.name}`;
          navigate(url);
          toastNotify.success(
            <>
              Network ACL<strong>{name}</strong> renamed to{" "}
              <ResourceLink type="network-acl" value={values.name} to={url} />.
            </>,
          );
          void formik.setFieldValue("isRenaming", false);
        })
        .catch((e) => {
          notify.failure("Renaming failed", e);
        })
        .finally(() => formik.setSubmitting(false));
    },
  });

  const isUsed = (acl?.used_by?.length ?? 0) > 0;

  return (
    <RenameHeader
      name={name}
      parentItems={[
        <Link to={`/ui/project/${project}/network-acls`} key={1}>
          Network ACLs
        </Link>,
      ]}
      renameDisabledReason={
        isUsed ? "Can not rename, network ACL is currently in use." : undefined
      }
      controls={
        acl && <DeleteNetworkAclBtn acl={acl} project={project} />
      }
      isLoaded={Boolean(acl)}
      formik={formik}
    />
  );
};

export default NetworkAclDetailHeader;

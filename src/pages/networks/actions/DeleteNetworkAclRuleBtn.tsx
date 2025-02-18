import { FC, useState } from "react";
import { LxdNetworkAcl, LxdNetworkAclRule, LxdNetworkAclRuleType } from "types/network";
import { queryKeys } from "util/queryKeys";
import { updateNetworkAcl } from "api/networks";
import { useQueryClient } from "@tanstack/react-query";
import {
  ConfirmationButton,
  Icon,
  useNotify,
} from "@canonical/react-components";
import { useToastNotification } from "context/toastNotificationProvider";

interface Props {
  acl: LxdNetworkAcl;
  project: string;
  index: number;
  type: string;
  onDelete: () => void;
}

const DeleteNetworkAclRuleBtn: FC<Props> = ({
  acl,
  project,
  index,
  type,
  onDelete,
}) => {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const [isLoading, setLoading] = useState(false);

  const ruleType: keyof LxdNetworkAcl = type as LxdNetworkAclRuleType;

  const handleDelete = () => {
    onDelete();
    setLoading(true);
    (acl[ruleType] as LxdNetworkAclRule[]).splice(index, 1);
    updateNetworkAcl({ ...acl, etag: acl.etag }, project)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            queryKeys.projects,
            project,
            queryKeys.networkAcls,
            acl.name,
          ],
        });
        setLoading(false);
        toastNotify.success(<>Network ACL rule deleted.</>);
      })
      .catch((e) => {
        notify.failure("Network ACL rule deletion failed", e);
      });
  };

  return (
    <ConfirmationButton
      appearance="base"
      onHoverText="Delete network ACL rule"
      confirmationModalProps={{
        title: "Confirm delete",
        confirmButtonAppearance: "negative",
        confirmButtonLabel: "Delete",
        children: (
          <p>
            Are you sure you want to delete selected network ACL rule?
            <br />
          </p>
        ),
        onConfirm: handleDelete,
      }}
      className="u-no-margin--bottom has-icon"
      loading={isLoading}
      shiftClickEnabled
      showShiftClickHint
    >
      <Icon name="delete" />
    </ConfirmationButton>
  );
};

export default DeleteNetworkAclRuleBtn;

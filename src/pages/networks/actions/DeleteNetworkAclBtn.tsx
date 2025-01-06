import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import ItemName from "components/ItemName";
import { LxdNetworkAcl } from "types/network";
import { deleteNetworkAcl } from "api/networks";
import { queryKeys } from "util/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import {
  ConfirmationButton,
  Icon,
  useNotify,
} from "@canonical/react-components";
import { useToastNotification } from "context/toastNotificationProvider";
import ResourceLabel from "components/ResourceLabel";
import { useSmallScreen } from "context/useSmallScreen";
import classnames from "classnames";

interface Props {
  acl: LxdNetworkAcl;
  project: string;
}

const DeleteNetworkAclBtn: FC<Props> = ({ acl, project }) => {
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isSmallScreen = useSmallScreen();

  const handleDelete = () => {
    setLoading(true);
    deleteNetworkAcl(acl.name, project)
      .then(() => {
        void queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === queryKeys.projects &&
            query.queryKey[1] === project &&
            query.queryKey[2] === queryKeys.networkAcls,
        });
        navigate(`/ui/project/${project}/network-acls`);
        toastNotify.success(
          <>
            Network ACL <ResourceLabel bold type="network-acls" value={acl.name} />{" "}
            deleted.
          </>,
        );
      })
      .catch((e) => {
        setLoading(false);
        notify.failure("Network ACL deletion failed", e);
      });
  };

  const isUsed = (acl.used_by?.length ?? 0) > 0;

  return (
    <ConfirmationButton
      onHoverText={
        isUsed ? "Can not delete, network ACL is currently in use" : ""
      }
      confirmationModalProps={{
        title: "Confirm delete",
        confirmButtonAppearance: "negative",
        confirmButtonLabel: "Delete",
        children: (
          <p>
            Are you sure you want to delete the network ACL{" "}
            <ItemName item={acl} bold />?<br />
            This action cannot be undone, and can result in data loss.
          </p>
        ),
        onConfirm: handleDelete,
      }}
      className={classnames("u-no-margin--bottom", {
        "has-icon": !isSmallScreen,
      })}
      loading={isLoading}
      disabled={isUsed}
      shiftClickEnabled
      showShiftClickHint
    >
      {!isSmallScreen && <Icon name="delete" />}
      <span>Delete ACL</span>
    </ConfirmationButton>
  );
};

export default DeleteNetworkAclBtn;

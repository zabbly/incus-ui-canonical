import { FC } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { ActionButton, useNotify } from "@canonical/react-components";
import { useFormik } from "formik";
import NetworkForwardForm, {
  NetworkForwardFormValues,
  NetworkForwardSchema,
  toNetworkForward,
} from "pages/networks/forms/NetworkForwardForm";
import {
  fetchNetworkForward,
  updateNetworkForward,
} from "api/network-forwards";
import { Link, useNavigate, useParams } from "react-router-dom";
import BaseLayout from "components/BaseLayout";
import HelpLink from "components/HelpLink";
import { useDocs } from "context/useDocs";
import FormFooterLayout from "components/forms/FormFooterLayout";
import { useToastNotification } from "context/toastNotificationProvider";
import { fetchNetwork } from "api/networks";

const EditNetworkForward: FC = () => {
  const docBaseLink = useDocs();
  const navigate = useNavigate();
  const notify = useNotify();
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const {
    network: networkName,
    project,
    forwardAddress,
  } = useParams<{
    network: string;
    project: string;
    forwardAddress: string;
  }>();

  const { data: network } = useQuery({
    queryKey: [queryKeys.projects, project, queryKeys.networks, networkName],
    queryFn: () => fetchNetwork(networkName ?? "", project ?? ""),
  });

  const { data: forward } = useQuery({
    queryKey: [
      queryKeys.projects,
      project,
      queryKeys.networks,
      networkName,
      queryKeys.forwards,
      forwardAddress,
    ],
    queryFn: () =>
      fetchNetworkForward(
        networkName ?? "",
        forwardAddress ?? "",
        project ?? "",
      ),
  });

  const formik = useFormik<NetworkForwardFormValues>({
    initialValues: {
      listenAddress: forwardAddress ?? "",
      defaultTargetAddress: forward?.config.target_address ?? "",
      description: forward?.description ?? "",
      ports:
        forward?.ports.map((port) => ({
          listenPort: port.listen_port,
          protocol: port.protocol,
          targetAddress: port.target_address,
          targetPort: port.target_port,
        })) ?? [],
      location: forward?.location,
    },
    enableReinitialize: true,
    validationSchema: NetworkForwardSchema,
    onSubmit: (values) => {
      const forward = toNetworkForward(values);

      updateNetworkForward(networkName ?? "", forward, project ?? "")
        .then(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              queryKeys.projects,
              project,
              queryKeys.networks,
              networkName,
              queryKeys.forwards,
            ],
          });
          navigate(`/ui/project/${project}/network/${networkName}/forwards`);
          toastNotify.success(
            `Network forward ${forward.listen_address} updated.`,
          );
        })
        .catch((e) => {
          formik.setSubmitting(false);
          notify.failure("Network forward update failed", e);
        });
    },
  });

  return (
    <BaseLayout
      title={
        <HelpLink
          href={`${docBaseLink}/howto/network_forwards/`}
          title="Learn more about network forwards"
        >
          Edit a network forward
        </HelpLink>
      }
      contentClassName="edit-network"
    >
      <NetworkForwardForm formik={formik} isEdit network={network} />
      <FormFooterLayout>
        <Link
          className="p-button--base"
          to={`/ui/project/${project}/network/${networkName}/forwards`}
        >
          Cancel
        </Link>
        <ActionButton
          appearance="positive"
          loading={formik.isSubmitting}
          disabled={!formik.isValid || !formik.values.listenAddress}
          onClick={() => void formik.submitForm()}
        >
          Update
        </ActionButton>
      </FormFooterLayout>
    </BaseLayout>
  );
};

export default EditNetworkForward;

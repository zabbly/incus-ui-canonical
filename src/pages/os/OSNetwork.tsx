import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  Spinner,
  useNotify,
  useToastNotification,
} from "@canonical/react-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOSNetwork, updateOSNetwork } from "api/os";
import NotificationRow from "components/NotificationRow";
import OSYamlEditor from "components/forms/OSYamlEditor";
import type { YamlFormValues } from "components/forms/YamlForm";
import { queryKeys } from "util/queryKeys";
import { yamlToObject } from "util/yaml";

interface Props {
  target: string;
}

const OSNetwork: FC<Props> = ({ target }) => {
  const toastNotify = useToastNotification();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);

  const {
    data: networkData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKeys.osNetwork, target],
    queryFn: async () => fetchOSNetwork(target),
  });

  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [target]);

  const onSubmit = (
    values: YamlFormValues,
    handleSuccess: () => void,
    handleFailure: () => void,
  ) => {
    updateOSNetwork(
      JSON.stringify({ config: yamlToObject(values.yaml) }),
      target,
    )
      .then(() => {
        toastNotify.success(<>Network updated</>);
        queryClient.invalidateQueries({
          queryKey: [queryKeys.osNetwork, target],
        });
        handleSuccess();
      })
      .catch((e) => {
        toastNotify.failure("Network update failed", e);
        handleFailure();
      });
  };

  if (error) {
    notify.failure("Loading network data failed", error);
  }

  return (
    <>
      <NotificationRow />
      {isLoading && (
        <Spinner className="u-loader" text="Loading network data..." />
      )}
      {!isLoading && !error && (
        <OSYamlEditor
          key={editorKey}
          yamlData={networkData}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
};

export default OSNetwork;

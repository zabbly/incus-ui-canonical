import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  Spinner,
  useNotify,
  useToastNotification,
} from "@canonical/react-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOSService, updateOSService } from "api/os";
import NotificationRow from "components/NotificationRow";
import OSYamlEditor from "components/forms/OSYamlEditor";
import type { YamlFormValues } from "components/forms/YamlForm";
import { queryKeys } from "util/queryKeys";
import { yamlToObject } from "util/yaml";

interface Props {
  name: string;
  target: string;
}

const OSServiceDetails: FC<Props> = ({ name, target }) => {
  const toastNotify = useToastNotification();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);

  const {
    data: serviceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKeys.osServiceDetails, name, target],
    queryFn: async () => fetchOSService(name, target),
  });

  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [target]);

  const onSubmit = (
    values: YamlFormValues,
    handleSuccess: () => void,
    handleFailure: () => void,
  ) => {
    updateOSService(
      name,
      JSON.stringify({ config: yamlToObject(values.yaml) }),
      target,
    )
      .then(() => {
        toastNotify.success(<>Service updated</>);
        queryClient.invalidateQueries({
          queryKey: [queryKeys.osServiceDetails, name, target],
        });
        handleSuccess();
      })
      .catch((e) => {
        toastNotify.failure("Service update failed", e);
        handleFailure();
      });
  };

  if (error) {
    notify.failure("Loading service data failed", error);
  }

  return (
    <>
      <NotificationRow />
      {isLoading && (
        <Spinner className="u-loader" text="Loading service data..." />
      )}
      {!isLoading && !error && (
        <OSYamlEditor
          key={editorKey}
          yamlData={serviceData}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
};

export default OSServiceDetails;

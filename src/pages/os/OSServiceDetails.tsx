import type { FC } from "react";
import { useEffect, useState } from "react";
import { useToastNotification } from "@canonical/react-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOSService, updateOSService } from "api/os";
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
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);

  const { data: serviceData } = useQuery({
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

  return (
    <OSYamlEditor key={editorKey} yamlData={serviceData} onSubmit={onSubmit} />
  );
};

export default OSServiceDetails;

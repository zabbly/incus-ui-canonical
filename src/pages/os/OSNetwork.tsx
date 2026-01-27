import type { FC } from "react";
import { useEffect, useState } from "react";
import { useToastNotification } from "@canonical/react-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOSNetwork, updateOSNetwork } from "api/os";
import OSYamlEditor from "components/forms/OSYamlEditor";
import type { YamlFormValues } from "components/forms/YamlForm";
import { queryKeys } from "util/queryKeys";
import { yamlToObject } from "util/yaml";

interface Props {
  target: string;
}

const OSNetwork: FC<Props> = ({ target }) => {
  const toastNotify = useToastNotification();
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);

  const { data: networkData } = useQuery({
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

  return (
    <OSYamlEditor key={editorKey} yamlData={networkData} onSubmit={onSubmit} />
  );
};

export default OSNetwork;

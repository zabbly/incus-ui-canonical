import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Spinner,
  useNotify,
  useToastNotification,
} from "@canonical/react-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOSSection, updateOSSection } from "api/os";
import NotificationRow from "components/NotificationRow";
import OSYamlEditor from "components/forms/OSYamlEditor";
import OSInfoView from "pages/os/info/OSInfoView";
import type { YamlFormValues } from "types/forms/instanceAndProfile";
import type { IncusOSConfig } from "types/os";
import { queryKeys } from "util/queryKeys";
import { objectToYaml, yamlToObject } from "util/yaml";

interface Props {
  endpoint: string;
  label: string;
  target: string;
  readOnly?: boolean;
  actions?: ReactNode;
  // Formatted view, the raw YAML stays available collapsed.
  info?: (data: IncusOSConfig) => ReactNode;
}

const OSConfigSection: FC<Props> = ({
  endpoint,
  label,
  target,
  readOnly = false,
  actions,
  info,
}) => {
  const toastNotify = useToastNotification();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [editorKey, setEditorKey] = useState(0);

  const queryKey = [queryKeys.osSection, endpoint, target];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => fetchOSSection(endpoint, target),
  });

  useEffect(() => {
    setEditorKey((k) => k + 1);
  }, [target]);

  const onSubmit = (
    values: YamlFormValues,
    handleSuccess: () => void,
    handleFailure: () => void,
  ) => {
    updateOSSection(endpoint, yamlToObject(values.yaml ?? ""), target)
      .then(() => {
        toastNotify.success(<>{label} updated</>);
        queryClient.invalidateQueries({ queryKey });
        handleSuccess();
      })
      .catch((e) => {
        toastNotify.failure(`${label} update failed`, e);
        handleFailure();
      });
  };

  if (error) {
    notify.failure(`Loading ${label.toLowerCase()} failed`, error);
  }

  return (
    <>
      <NotificationRow />
      {actions && (
        <div className="incusos-section-actions u-sv2">{actions}</div>
      )}
      {isLoading && (
        <Spinner
          className="u-loader"
          text={`Loading ${label.toLowerCase()}...`}
        />
      )}
      {!isLoading && !error && readOnly && info && data && (
        <OSInfoView yamlData={data}>{info(data)}</OSInfoView>
      )}
      {!isLoading && !error && readOnly && !info && (
        <pre className="yaml-code">
          <code>{objectToYaml(data ?? {})}</code>
        </pre>
      )}
      {!isLoading && !error && !readOnly && (
        <OSYamlEditor
          key={editorKey}
          yamlData={data}
          info={info && data ? info(data) : undefined}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
};

export default OSConfigSection;

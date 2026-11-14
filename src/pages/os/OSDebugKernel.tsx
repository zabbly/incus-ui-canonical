import type { FC } from "react";
import { Spinner, useNotify } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchDebugKernel } from "api/os";
import NotificationRow from "components/NotificationRow";
import OSInfoView, {
  OSInfoList,
  OSInfoSection,
  OSInfoTable,
} from "pages/os/info/OSInfoView";
import { queryKeys } from "util/queryKeys";

interface Props {
  target: string;
}

const OSDebugKernel: FC<Props> = ({ target }) => {
  const notify = useNotify();

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKeys.osDebugKernel, target],
    queryFn: async () => fetchDebugKernel(target),
  });

  if (error) {
    notify.failure("Loading kernel details failed", error);
  }

  return (
    <>
      <NotificationRow />
      {isLoading && (
        <Spinner className="u-loader" text="Loading kernel details..." />
      )}
      {!isLoading && !error && data && (
        <OSInfoView yamlData={data}>
          <OSInfoSection title="Kernel">
            <OSInfoList
              items={[
                ["Kernel version", data.version],
                ["Architecture", data.architecture],
                ["CPU baseline", data.cpu_baseline],
              ]}
            />
          </OSInfoSection>
          <OSInfoSection title="Modules">
            <OSInfoTable
              headers={["Name", "Dependencies", "In use"]}
              rows={(data.modules ?? []).map((module) => [
                module.name,
                (module.dependencies ?? []).join(", "),
                module.in_use ? "Yes" : "No",
              ])}
            />
          </OSInfoSection>
        </OSInfoView>
      )}
    </>
  );
};

export default OSDebugKernel;

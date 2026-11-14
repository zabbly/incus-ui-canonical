import type { FC } from "react";
import { Link } from "react-router-dom";
import { Spinner, useNotify } from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { fetchOSLicense } from "api/os";
import NotificationRow from "components/NotificationRow";
import { queryKeys } from "util/queryKeys";

interface Props {
  name: string;
  target: string;
}

const OSLicenseDetails: FC<Props> = ({ name, target }) => {
  const notify = useNotify();

  const {
    data: license,
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKeys.osLicenses, name, target],
    queryFn: async () => fetchOSLicense(name, target),
  });

  if (error) {
    notify.failure("Loading license failed", error);
  }

  return (
    <div>
      <NotificationRow />
      <div className="u-sv2">
        <Link to="/ui/os/licenses">&larr; Licenses</Link>
      </div>
      {isLoading && <Spinner className="u-loader" text="Loading license..." />}
      {!isLoading && !error && license && (
        <>
          <h2 className="p-heading--5">
            {license.name}{" "}
            <span className="u-text--muted">({license.type})</span>
          </h2>
          <pre className="incusos-license">
            <code>{license.content}</code>
          </pre>
        </>
      )}
    </div>
  );
};

export default OSLicenseDetails;

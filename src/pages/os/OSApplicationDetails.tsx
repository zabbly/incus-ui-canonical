import type { FC } from "react";
import { Link } from "react-router-dom";
import { runOSAction } from "api/os";
import OSConfigSection from "pages/os/OSConfigSection";
import OSActionButton, { jsonField } from "pages/os/actions/OSActionButton";

interface Props {
  name: string;
  target: string;
}

const OSApplicationDetails: FC<Props> = ({ name, target }) => {
  return (
    <div>
      <div className="u-sv2">
        <Link to="/ui/os/applications">&larr; Applications</Link>
      </div>
      <OSConfigSection
        endpoint={`applications/${name}`}
        label="Application"
        target={target}
        actions={
          <>
            <OSActionButton
              label="Run action"
              mode="fields"
              submitLabel="Run"
              confirmMessage={`Perform an application-specific action on ${name}.`}
              fields={[jsonField]}
              run={async (_, values) =>
                runOSAction(
                  `applications/${name}`,
                  "action",
                  target,
                  JSON.parse(String(values.data) || "{}") as object,
                )
              }
              successMessage={`Action run on ${name}`}
            />
            <OSActionButton
              label="Debug"
              mode="fields"
              submitLabel="Run"
              confirmMessage={`Run an application-specific debug call on ${name}.`}
              fields={[jsonField]}
              run={async (_, values) =>
                runOSAction(
                  `applications/${name}`,
                  "debug",
                  target,
                  JSON.parse(String(values.data) || "{}") as object,
                )
              }
              successMessage={`Debug call run on ${name}`}
            />
          </>
        }
      />
    </div>
  );
};

export default OSApplicationDetails;

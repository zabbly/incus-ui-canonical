import type { FC } from "react";
import { runOSActionUpload } from "api/os";
import TabLinks from "components/TabLinks";
import OSConfigSection from "pages/os/OSConfigSection";
import OSActionButton from "pages/os/actions/OSActionButton";
import OSDebugKernel from "pages/os/OSDebugKernel";
import OSDebugLog from "pages/os/OSDebugLog";
import OSDebugLVM from "pages/os/OSDebugLVM";
import OSDebugNetwork from "pages/os/OSDebugNetwork";
import OSDebugReport from "pages/os/OSDebugReport";
import OSDebugScript from "pages/os/OSDebugScript";
import OSDebugProcesses from "pages/os/OSDebugProcesses";
import { slugify } from "util/slugify";

const tabs = [
  "Log",
  "Kernel",
  "LVM",
  "Network",
  "Processes",
  "Report",
  "Run script",
  "Secure Boot",
];

interface ActionsProps {
  target: string;
}

const SecureBootActions: FC<ActionsProps> = ({ target }) => (
  <OSActionButton
    label="Update keys"
    mode="upload"
    confirmMessage="Upload a signed secure boot key update to apply."
    run={async (input) =>
      runOSActionUpload("debug/secureboot", "update", input as File, target)
    }
    successMessage="Secure boot keys update triggered"
  />
);

interface Props {
  subTab?: string;
  target: string;
}

const OSDebug: FC<Props> = ({ subTab, target }) => {
  return (
    <>
      <TabLinks tabs={tabs} activeTab={subTab} tabUrl={`/ui/os/debug`} />
      {(!subTab || subTab === slugify("Log")) && <OSDebugLog target={target} />}
      {subTab === slugify("Kernel") && <OSDebugKernel target={target} />}
      {subTab === slugify("LVM") && <OSDebugLVM target={target} />}
      {subTab === slugify("Network") && <OSDebugNetwork target={target} />}
      {subTab === slugify("Report") && <OSDebugReport target={target} />}
      {subTab === slugify("Run script") && <OSDebugScript target={target} />}
      {subTab === slugify("Processes") && <OSDebugProcesses target={target} />}
      {subTab === slugify("Secure Boot") && (
        <OSConfigSection
          endpoint="debug/secureboot/event-log"
          label="Secure boot event log"
          target={target}
          readOnly
          actions={<SecureBootActions target={target} />}
        />
      )}
    </>
  );
};

export default OSDebug;

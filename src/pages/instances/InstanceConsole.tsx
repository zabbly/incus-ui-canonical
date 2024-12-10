import { FC, useEffect, useState, useRef } from "react";
import {
  ActionButton,
  Button,
  ContextualMenu,
  EmptyState,
  Icon,
  RadioInput,
  useNotify,
} from "@canonical/react-components";
import InstanceGraphicConsole from "./InstanceGraphicConsole";
import { LxdInstance } from "types/instance";
import InstanceTextConsole from "./InstanceTextConsole";
import { useInstanceStart } from "util/instanceStart";
import {
  sendAltF4,
  sendAltTab,
  sendCtrlAltDel,
} from "../../lib/spice/src/inputs";
import AttachIsoBtn from "pages/instances/actions/AttachIsoBtn";
import NotificationRow from "components/NotificationRow";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import { useOperations } from "context/operationsProvider";
import { getInstanceName, getProjectName } from "util/operations";

interface Props {
  instance: LxdInstance;
}

const InstanceConsole: FC<Props> = ({ instance }) => {
  const notify = useNotify();
  const isVm = instance.type === "virtual-machine";
  const [isGraphic, setGraphic] = useState(isVm);
  const { hasCustomVolumeIso } = useSupportedFeatures();
  const isRunning = instance.status === "Running";

  const [attemptConnection, setAttemptConnection] = useState(true);
  const [instancePreviousState, setInstancePreviousState] = useState("");
  const { operations, isFetching } = useOperations();
  const lastRestartOp = useRef("");

  const onFailure = (title: string, e: unknown, message?: string) => {
    notify.failure(title, e, message);
  };

  const showNotRunningInfo = () => {
    notify.info(
      "Start the instance to interact with the text console.",
      "Instance not running",
    );
  };

  let handleFullScreen = () => {
    /**/
  };

  const handleConnection = () => {
    setAttemptConnection(true);
  };

  const onChildMount = (childHandleFullScreen: () => void) => {
    handleFullScreen = childHandleFullScreen;
  };

  const setGraphicConsole = (isGraphic: boolean) => {
    notify.clear();
    setGraphic(isGraphic);
    setAttemptConnection(true);
  };

  const { handleStart, isLoading } = useInstanceStart(instance);

  useEffect(() => {
    // Initial run.
    if (instancePreviousState == "") {
      setInstancePreviousState(instance.status);
      setAttemptConnection(isRunning);
      return;
    }

    // Check if there are any relevant instance operations.
    operations.filter((operation) => {
      const projectName = getProjectName(operation);
      const instanceName = getInstanceName(operation);

      if (projectName == instance.project && instanceName == instance.name && ["Starting instance", "Stopping instance", "Restarting instance"].includes(operation.description)) {
        return true;
      }
      return false;
    }).sort((a, b) => {
        new Date(a.created_at) > new Date(b.created_at)
    }).forEach((op) => {
      if (op.description == "Restarting instance" && op.created_at != lastRestartOp.current) {
        lastRestartOp.current = op.created_at;
      } else if (["Starting instance", "Stopping instance"].includes(op.description)){
        lastRestartOp.current = "";
      }
    });

    // If instance state doesn't change, do nothing.
    if (instancePreviousState == instance.status) {
      return;
    }

    setInstancePreviousState(instance.status);
    setAttemptConnection(lastRestartOp.current != "" && attemptConnection);

  }, [instance.state, attemptConnection, instancePreviousState]);

  return (
    <div className="instance-console-tab">
      {isVm && (
        <div className="p-panel__controls">
          <div className="console-radio-wrapper">
            <RadioInput
              labelClassName="right-margin"
              label="Graphic"
              checked={isGraphic}
              onChange={() => setGraphicConsole(true)}
            />
            <RadioInput
              label="Text console"
              checked={!isGraphic}
              onChange={() => setGraphicConsole(false)}
            />
          </div>
          {isRunning && (
            <div>
              {!attemptConnection && <Button
                className="u-no-margin--bottom"
                onClick={() => handleConnection()}
              >
                <span>Connect</span>
              </Button>}
              {isGraphic && hasCustomVolumeIso && <AttachIsoBtn instance={instance} />}
              {isGraphic &&
              <Button
                className="u-no-margin--bottom"
                onClick={() => handleFullScreen()}
              >
                <span>Fullscreen</span>
              </Button>}
              {isGraphic &&
              <ContextualMenu
                hasToggleIcon
                toggleLabel="Shortcuts"
                toggleClassName="u-no-margin--bottom"
                links={[
                  {
                    children: "Send Ctrl + Alt + Del",
                    onClick: () => sendCtrlAltDel(window.spice_connection),
                  },
                  {
                    children: "Send Alt + TAB",
                    onClick: () => sendAltTab(window.spice_connection),
                  },
                  {
                    children: "Send Alt + F4",
                    onClick: () => sendAltF4(window.spice_connection),
                  },
                ]}
              />}
            </div>
          )}
        </div>
      )}
      <NotificationRow />
      {isGraphic && !isRunning && (
        <EmptyState
          className="empty-state"
          image={<Icon name="pods" className="empty-state-icon" />}
          title="Instance stopped"
        >
          <p>Start the instance to access the graphic console.</p>
          <ActionButton
            appearance="positive"
            loading={isLoading}
            onClick={handleStart}
          >
            Start instance
          </ActionButton>
        </EmptyState>
      )}
      {isGraphic && attemptConnection && (
        <div className="spice-wrapper">
          <InstanceGraphicConsole
            instance={instance}
            onMount={onChildMount}
            onFailure={onFailure}
          />
        </div>
      )}
      {!isGraphic && attemptConnection && (
        <InstanceTextConsole
          instance={instance}
          onFailure={onFailure}
          showNotRunningInfo={showNotRunningInfo}
        />
      )}
    </div>
  );
};

export default InstanceConsole;

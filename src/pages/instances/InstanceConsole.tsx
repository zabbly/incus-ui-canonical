import type { FC } from "react";
import { useEffect, useState, useRef } from "react";
import {
  ActionButton,
  Button,
  ContextualMenu,
  EmptyState,
  Icon,
  Notification,
  RadioInput,
  useNotify,
} from "@canonical/react-components";
import InstanceGraphicConsole from "./InstanceGraphicConsole";
import type { LxdInstance } from "types/instance";
import { LxdOperation } from "types/operation";
import InstanceTextConsole from "./InstanceTextConsole";
import { useInstanceStart } from "util/instanceStart";
import { sendAltF4, sendAltTab, sendCtrlAltDel } from "lib/spice/src/inputs.js";
import AttachIsoBtn from "pages/instances/actions/AttachIsoBtn";
import NotificationRow from "components/NotificationRow";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import { useInstanceEntitlements } from "util/entitlements/instances";
import { isInstanceRunning } from "util/instanceStatus";
import { useOperations } from "context/operationsProvider";
import { getInstanceName, getProjectName, findOperation } from "util/operations";

interface Props {
  instance: LxdInstance;
}

const InstanceConsole: FC<Props> = ({ instance }) => {
  const notify = useNotify();
  const isVm = instance.type === "virtual-machine";
  const [isGraphic, setGraphic] = useState(isVm);
  const { hasCustomVolumeIso } = useSupportedFeatures();
  const { canUpdateInstanceState, canAccessInstanceConsole } =
    useInstanceEntitlements();

  const isRunning = isInstanceRunning(instance);

  const [attemptConnection, setAttemptConnection] = useState(isRunning);
  const { operations, isFetching } = useOperations();
  const lastOp = useRef({"restart": "", "start": "", "stop":""});
  const [showConnectBtn, setShowConnectBtn] = useState(false);

  const onFailure = (title: string, e: unknown, message?: string) => {
    notify.failure(title, e, message);
    setShowConnectBtn(true);
    setAttemptConnection(false);
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
    setShowConnectBtn(false);
    setAttemptConnection(true);
  };

  const onChildMount = (childHandleFullScreen: () => void) => {
    handleFullScreen = childHandleFullScreen;
  };

  const setGraphicConsole = (isGraphic: boolean) => {
    notify.clear();
    setGraphic(isGraphic);
    setShowConnectBtn(false);
    setAttemptConnection(true);
  };

  const { handleStart, isLoading } = useInstanceStart(instance);

  if (!canAccessInstanceConsole(instance)) {
    return (
      <Notification severity="caution" title="Restricted permissions">
        You do not have permission to access the console for this instance.
      </Notification>
    );
  }

  useEffect(() => {
    // Check if there are any relevant instance operations.
    let restartOp = findOperation(instance, operations, "Restarting instance");

    if (restartOp) {
      if (restartOp.status == "Success" && lastOp.current["restart"] != restartOp.created_at && attemptConnection) {
        // Reconnect console if restart operation was detected.
        lastOp.current["restart"] = restartOp.created_at;
        setAttemptConnection(false);
        setTimeout(() => {setAttemptConnection(true);}, 2000);
      }
    }

    let startOp = findOperation(instance, operations, "Starting instance");
    if (startOp) {
      // Disconect console if start operation was detected.
      setAttemptConnection(false);
      if (lastOp.current["start"] != startOp.created_at && startOp.status == "Success") {
        setShowConnectBtn(true);
        lastOp.current["start"] = startOp.created_at;
      }
    }

    let stopOp = findOperation(instance, operations, "Stopping instance");
    if (stopOp) {
      // Disconect console if stop operation was detected.
      setAttemptConnection(false);
      if (stopOp.status == "Success" && lastOp.current["stop"] != stopOp.created_at) {
        setShowConnectBtn(false);
        lastOp.current["stop"] = stopOp.created_at;
      }
    }
  }, [operations, attemptConnection, showConnectBtn]);

  return (
    <div className="instance-console-tab">
      {!isVm && (
        <div className="p-panel__controls">
            {isRunning && showConnectBtn && <Button
              className="u-no-margin--bottom control-button"
              hasIcon
              onClick={() => handleConnection()}
              >
                <Icon name="connected" />
                <span>Reconnect</span>
              </Button>}
        </div>
      )}
      {isVm && (
        <div className="p-panel__controls">
          <div className="console-radio-wrapper">
            <RadioInput
              labelClassName="right-margin"
              label="Graphic"
              checked={isGraphic}
              onChange={() => {
                setGraphicConsole(true);
              }}
            />
            <RadioInput
              label="Text console"
              checked={!isGraphic}
              onChange={() => {
                setGraphicConsole(false);
              }}
            />
          </div>
          {isRunning && (
            <div>
              {showConnectBtn && <Button
              className="u-no-margin--bottom"
              hasIcon
              onClick={() => handleConnection()}
              >
                <Icon name="connected" />
                <span>Reconnect</span>
              </Button>}
              {isGraphic && hasCustomVolumeIso && <AttachIsoBtn instance={instance} />}
              {isGraphic &&
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  handleFullScreen();
                }}
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
                    onClick: () => {
                      sendCtrlAltDel(window.spice_connection);
                    },
                  },
                  {
                    children: "Send Alt + TAB",
                    onClick: () => {
                      sendAltTab(window.spice_connection);
                    },
                  },
                  {
                    children: "Send Alt + F4",
                    onClick: () => {
                      sendAltF4(window.spice_connection);
                    },
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
            disabled={!canUpdateInstanceState(instance)}
            title={
              canUpdateInstanceState(instance)
                ? ""
                : "You do not have permission to start this instance."
            }
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

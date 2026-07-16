import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { unstable_usePrompt as usePrompt, useParams } from "react-router-dom";
import { FitAddon } from "@xterm/addon-fit";
import { connectInstanceExec } from "api/instances";
import { getWsErrorMsg } from "util/helpers";
import { ROOT_PATH } from "util/rootPath";
import ReconnectTerminalBtn from "./actions/ReconnectTerminalBtn";
import type { TerminalConnectPayload } from "types/terminal";
import { updateMaxHeight } from "util/updateMaxHeight";
import type { LxdInstance } from "types/instance";
import { useInstanceStart } from "util/instanceStart";
import Xterm from "components/Xterm";
import type { Terminal } from "@xterm/xterm";
import type { NotificationType } from "@canonical/react-components";
import {
  ActionButton,
  EmptyState,
  Icon,
  Notification,
  useListener,
  Spinner,
  Button,
  failure,
  useNotify,
} from "@canonical/react-components";
import { useOperations } from "context/operationsProvider";
import { LxdOperation } from "types/operation";
import {
  getInstanceName,
  getProjectName,
  findOperation,
} from "util/operations";
import NotificationRow from "components/NotificationRow";
import { useInstanceEntitlements } from "util/entitlements/instances";
import { isInstanceRunning } from "util/instanceStatus";
import {
  createWindowsLineState,
  getDefaultPayload,
  translateWindowsInput,
} from "util/instanceTerminal";
import { isWindowsInstance } from "util/instances";

const XTERM_OPTIONS = {
  theme: {
    background: "#292c2f",
  },
};

interface Props {
  instance: LxdInstance;
  refreshInstance: () => Promise<unknown>;
}

const InstanceTerminal: FC<Props> = ({ instance, refreshInstance }) => {
  const notify = useNotify();
  const { name, project } = useParams<{
    name: string;
    project: string;
  }>();
  const textEncoder = new TextEncoder();
  const [error, setError] = useState<NotificationType | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [dataWs, setDataWs] = useState<WebSocket | null>(null);
  const [controlWs, setControlWs] = useState<WebSocket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [payload, setPayload] = useState<TerminalConnectPayload>(() =>
    getDefaultPayload(instance),
  );
  const [fitAddon] = useState<FitAddon>(new FitAddon());
  const [userInteracted, setUserInteracted] = useState(false);
  const { operations, isFetching } = useOperations();
  const xtermRef = useRef<Terminal>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lineRef = useRef(createWindowsLineState());
  const [version, setVersion] = useState(0);
  const { canUpdateInstanceState, canExecInstance } = useInstanceEntitlements();
  const lastFailureOp = useRef<LxdOperation | null>(null);

  usePrompt({
    when: userInteracted,
    message: "Are you sure you want to leave this page?",
  });

  const handleCloseTab = (e: BeforeUnloadEvent) => {
    if (userInteracted) {
      e.returnValue = "Are you sure you want to leave this page?";
    }
  };
  useListener(window, handleCloseTab, "beforeunload");

  // Windows VMs only support non-interactive exec (no PTY): stdin, stdout and
  // stderr are three separate fds instead of a single bidirectional "0" fd.
  const interactive = !isWindowsInstance(instance);

  const openWebsockets = async (payload: TerminalConnectPayload) => {
    if (!name) {
      setError(failure("Missing name", new Error()));
      return;
    }
    if (!project) {
      setError(failure("Missing project", new Error()));
      return;
    }

    setLoading(true);
    lineRef.current = createWindowsLineState();
    const result = await connectInstanceExec(
      name,
      project,
      payload,
      interactive,
    ).catch((e) => {
      setLoading(false);
      setError(failure("Connection failed", e));
    });
    if (!result) {
      return;
    }

    const operationUrl = result.operation.split("?")[0];
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const buildUrl = (secret: string) =>
      `${protocol}://${location.host}${ROOT_PATH}${operationUrl}/websocket?secret=${secret}`;
    const fds = result.metadata.metadata.fds;

    const writeToTerminal = (message: MessageEvent<ArrayBuffer>) => {
      const isOriginMatch = message.origin === `${protocol}://${location.host}`;
      if (!message.isTrusted || !isOriginMatch) {
        console.error("Ignoring untrusted message", message);
        return;
      }

      const bytes = new Uint8Array(message.data);
      if (interactive) {
        xtermRef.current?.write(bytes);
        return;
      }

      // The guest echoes our backspace as a bare BS, which only moves the
      // cursor. Expand it to the destructive sequence so it erases on screen.
      const expanded: number[] = [];
      bytes.forEach((byte) => {
        if (byte === 0x08) {
          expanded.push(0x08, 0x20, 0x08);
        } else {
          expanded.push(byte);
        }
      });
      xtermRef.current?.write(new Uint8Array(expanded));
    };

    const control = new WebSocket(buildUrl(fds.control));
    // In both modes fds["0"] is the socket we send keyboard input to (stdin).
    const data = new WebSocket(buildUrl(fds["0"]));
    // Non-interactive mode delivers output on separate stdout/stderr sockets.
    const stdout =
      !interactive && fds["1"] ? new WebSocket(buildUrl(fds["1"])) : null;
    const stderr =
      !interactive && fds["2"] ? new WebSocket(buildUrl(fds["2"])) : null;

    const sockets = [data, control, stdout, stderr].filter(
      (socket): socket is WebSocket => socket !== null,
    );
    const closeAll = () => {
      sockets.forEach((socket) => {
        socket.close();
      });
    };

    control.onopen = () => {
      setLoading(false);
      setControlWs(control);
      setRefreshKey((prev) => prev + 1);
    };

    control.onerror = (e) => {
      setError(failure("Error", e));
    };

    control.onclose = (event) => {
      if (1005 !== event.code) {
        setError(failure("Error", event.reason, getWsErrorMsg(event.code)));
      }
      closeAll();
      setDataWs(null);
    };

    data.onopen = () => {
      setDataWs(data);
      setRefreshKey((prev) => prev + 1);
    };

    data.onerror = (e) => {
      setError(failure("Error", e));
    };

    data.onclose = (event) => {
      if (1005 !== event.code) {
        setError(failure("Error", event.reason, getWsErrorMsg(event.code)));
      }
      closeAll();
      setControlWs(null);
      setUserInteracted(false);
    };

    data.binaryType = "arraybuffer";
    if (interactive) {
      data.onmessage = writeToTerminal;
    }

    [stdout, stderr].forEach((socket) => {
      if (!socket) {
        return;
      }
      socket.binaryType = "arraybuffer";
      socket.onmessage = writeToTerminal;
      socket.onerror = (e) => {
        setError(failure("Error", e));
      };
      socket.onclose = () => {
        closeAll();
      };
    });

    return sockets;
  };

  const isRunning = isInstanceRunning(instance);
  const isBooting = isRunning && (instance.state?.processes ?? 0) < 1;
  const canConnect = isRunning && !isBooting;
  const displayConsole = canConnect || controlWs !== null;
  const canExec = canExecInstance(instance);

  useEffect(() => {
    if (isBooting && refreshTimerRef.current === null) {
      const delay = 1000;
      const triggerRefresh = () => {
        void refreshInstance();
        refreshTimerRef.current = null;
        setVersion((old) => old + 1);
      };
      const timeout = setTimeout(triggerRefresh, delay);
      refreshTimerRef.current = timeout;

      return () => {
        clearTimeout(timeout);
      };
    } else {
      return () => {};
    }
  }, [isBooting, version]);

  useEffect(() => {
    // Check if there are any relevant instance operations.
    let op = findOperation(instance, operations, "Executing command");

    if (op) {
      if (op.status == "Failure" && op.err != "" && (lastFailureOp.current == null || lastFailureOp.current.id != op.id)) {
        notify.failure("Error", op.status_code, op.err);
        lastFailureOp.current = op;
      }
    }
  }, [operations]);

  useEffect(() => {
    if (canConnect && canExec) {
      xtermRef.current?.clear();
      setError(null);
      const websocketPromise = openWebsockets(payload);
      return () => {
        void websocketPromise.then((websockets) => {
          websockets?.map((websocket) => {
            websocket.close();
          });
        });
      };
    } else {
      return () => {};
    }
  }, [payload, instance.status, canConnect, canExec]);

  const handleResize = () => {
    if (!displayConsole) {
      return;
    }

    updateMaxHeight("p-terminal", undefined, 10);

    xtermRef.current?.element?.style.setProperty("padding", "1rem");
    fitAddon.fit();

    const dimensions = fitAddon.proposeDimensions();
    controlWs?.send(
      textEncoder.encode(
        JSON.stringify({
          command: "window-resize",
          args: {
            height: dimensions?.rows.toString(),
            width: dimensions?.cols.toString(),
          },
        }),
      ),
    );
  };

  // calling handleResize again after a timeout to fix a race condition
  // between updateMaxHeight and fitAddon.fit
  useListener(
    window,
    () => {
      handleResize();
      setTimeout(handleResize, 500);
    },
    "resize",
    true,
  );

  useListener(window, handleResize, "menu-collapse-toggle");
  useEffect(handleResize, [error?.message]);

  const handleTerminalOpen = () => {
    handleResize();
    xtermRef.current?.focus();
  };

  const { handleStart, isLoading: isStartLoading } = useInstanceStart(instance);

  if (!canExec) {
    return (
      <Notification severity="caution" title="Restricted permissions">
        You do not have permission to use the terminal for this instance.
      </Notification>
    );
  }

  const isDisabled =
    !canUpdateInstanceState(instance) || isBooting || isStartLoading;

  const handleFullscreen = () => {
    xtermRef.current?.element
      ?.requestFullscreen()
      .then(handleResize)
      .then(() => {
        xtermRef.current?.focus();
      })
      .catch((e) => {
        setError(failure("Failed to enter full-screen mode", e));
      });
  };

  return (
    <div className="instance-terminal-tab">
      {displayConsole && (
        <>
          <div className="p-panel__controls">
            <Button
              className="u-no-margin--bottom"
              onClick={handleFullscreen}
              disabled={isLoading || !controlWs}
              hasIcon
            >
              <Icon name="fullscreen" />
              <span>Fullscreen</span>
            </Button>
            <ReconnectTerminalBtn
              reconnect={setPayload}
              payload={payload}
              instance={instance}
            />
          </div>
          {error && (
            <Notification
              title={error.title}
              severity="negative"
              onDismiss={() => {
                setError(null);
              }}
            >
              {error.message}
            </Notification>
          )}
          {isLoading && (
            <Spinner className="u-loader" text="Loading terminal session..." />
          )}
          {controlWs && (
            <Xterm
              key={refreshKey}
              ref={xtermRef}
              addons={[fitAddon]}
              options={XTERM_OPTIONS}
              onData={(data) => {
                setUserInteracted(true);
                if (dataWs?.readyState === WebSocket.CLOSED) {
                  setError(
                    failure(
                      "Failed sending command",
                      new Error(
                        "WebSocket is closed. Ensure instance is running and reconnect.",
                      ),
                    ),
                  );
                } else if (interactive) {
                  dataWs?.send(textEncoder.encode(data));
                } else {
                  const outgoing = translateWindowsInput(data, lineRef.current);
                  if (outgoing.length > 0) {
                    dataWs?.send(textEncoder.encode(outgoing));
                  }
                }
              }}
              onOpen={handleTerminalOpen}
              className="p-terminal"
            />
          )}
        </>
      )}
      {!displayConsole && (
        <EmptyState
          className="empty-state"
          image={<Icon name="pods" className="empty-state-icon" />}
          title={isBooting ? "Instance starting" : "Instance stopped"}
        >
          <p>
            {isBooting
              ? "Terminal will be ready once the instance has finished booting."
              : "Start the instance to access the terminal."}
          </p>
          <ActionButton
            appearance="positive"
            loading={isStartLoading || isBooting}
            onClick={handleStart}
            disabled={isDisabled}
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
    </div>
  );
};

export default InstanceTerminal;

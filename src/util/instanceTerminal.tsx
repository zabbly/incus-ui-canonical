import type { LxdInstance } from "types/instance";
import type { TerminalConnectPayload } from "types/terminal";
import { isWindowsInstance } from "util/instances";

export const UI_TERMINAL_DEFAULT_PAYLOAD = "user.ui_terminal_default_payload";

const BASH_DISTROS = ["ubuntu", "debian", "fedora"];

// Length of the guest's current input line.
export interface WindowsLineState {
  length: number;
}

export const createWindowsLineState = (): WindowsLineState => ({ length: 0 });

// Translates xterm keystrokes into what a PTY-less Windows exec expects.
export const translateWindowsInput = (
  data: string,
  line: WindowsLineState,
): string => {
  let outgoing = "";

  for (const char of data) {
    if (char === "\x7f" || char === "\b") {
      // xterm sends DEL for backspace, Windows expects BS. On an empty line it
      // has to be dropped, or the guest's reader blocks and the terminal hangs.
      if (line.length > 0) {
        outgoing += "\b";
        line.length -= 1;
      }
    } else if (char === "\r" || char === "\n") {
      // A bare CR does not submit the line, the guest needs a CRLF. xterm sends
      // CR for Enter and rewrites pasted newlines to CR, so no CRLF can reach
      // us already formed and be doubled here.
      outgoing += "\r\n";
      line.length = 0;
    } else {
      // Everything else.
      outgoing += char;
      line.length += 1;
    }
  }

  return outgoing;
};

const getCommand = (instance: LxdInstance): string => {
  if (isWindowsInstance(instance)) {
    return "powershell.exe";
  }
  return "bash";
};

const getEnvironment = (instance: LxdInstance) => {
  // Windows exec runs non-interactively without a PTY, so the bash-oriented
  // environment below does not apply.
  if (isWindowsInstance(instance)) {
    return [];
  }

  const os = instance.config["image.os"]?.toLowerCase() || "";

  const environment = [
    {
      key: "TERM",
      value: "xterm-256color",
    },
    {
      key: "HOME",
      value: "/root",
    },
    {
      key: "PATH",
      value:
        "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin:/run/current-system/sw/bin",
    },
    {
      key: "LANG",
      value: "C.UTF-8",
    },
    {
      key: "USER",
      value: "root",
    },
  ];

  if (BASH_DISTROS.includes(os)) {
    environment.push({
      key: "force_color_prompt",
      value: "yes",
    });
  }

  return environment;
};

const createDefaultPayload = (instance: LxdInstance) => {
  return {
    command: getCommand(instance),
    environment: getEnvironment(instance),
    user: 0,
    group: 0,
  };
};

export const getDefaultPayload = (instance: LxdInstance) => {
  const userPayload = instance.config[UI_TERMINAL_DEFAULT_PAYLOAD];
  if (userPayload) {
    return JSON.parse(userPayload) as TerminalConnectPayload;
  }

  return createDefaultPayload(instance);
};

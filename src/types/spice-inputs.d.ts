declare module "lib/spice/src/inputs.js" {
  import type * as SpiceHtml5 from "lib/spice/src/main";

  export function sendKey(connection?: SpiceHtml5.SpiceMainConn, keycode?: number, modifiers?: number[]): void;
}

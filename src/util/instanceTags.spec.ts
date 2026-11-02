import type { LxdInstance } from "types/instance";
import {
  getInstanceTagChips,
  getKnownTags,
  getTagColor,
  getTagFormValues,
  hashColor,
  isTagConfigKey,
  parseKeyValues,
  parseTags,
  serializeKeyValues,
  serializeTags,
  tagsPayload,
  textColorFor,
} from "./instanceTags";

describe("isTagConfigKey", () => {
  it("matches the three tag keys only", () => {
    expect(isTagConfigKey("user.tags")).toBe(true);
    expect(isTagConfigKey("user.tag_colors")).toBe(true);
    expect(isTagConfigKey("user.ip_tags")).toBe(true);
    expect(isTagConfigKey("user.hostname")).toBe(false);
  });
});

describe("getTagFormValues", () => {
  it("reads tags, colors and ip tags from the config", () => {
    expect(
      getTagFormValues({
        "user.tags": "os;web",
        "user.tag_colors": "os=#123456",
        "user.ip_tags": "ipv4=#00ff00",
      }),
    ).toEqual({
      tags: ["os", "web"],
      tagColors: { os: "#123456" },
      ipTags: { ipv4: "#00ff00" },
    });
  });

  it("is empty for a config without tags", () => {
    expect(getTagFormValues({ "user.hostname": "x" })).toEqual({
      tags: [],
      tagColors: {},
      ipTags: {},
    });
  });
});

describe("tagsPayload", () => {
  it("serializes the form values into config keys", () => {
    expect(
      tagsPayload({
        tags: ["os", "web"],
        tagColors: { os: "#123456", gone: "#000000" },
        ipTags: { ipv4: "#00ff00" },
      }),
    ).toEqual({
      "user.tags": "os;web",
      "user.tag_colors": "os=#123456",
      "user.ip_tags": "ipv4=#00ff00",
    });
  });

  it("removes the keys when nothing is set", () => {
    expect(tagsPayload({ tags: [], tagColors: {}, ipTags: {} })).toEqual({
      "user.tags": undefined,
      "user.tag_colors": undefined,
      "user.ip_tags": undefined,
    });
  });

  it("leaves the config alone without form values", () => {
    expect(tagsPayload(undefined)).toEqual({});
  });
});

const make = (
  name: string,
  config: Record<string, string> = {},
  addresses: { family: string; address: string }[] = [],
): LxdInstance =>
  ({
    name,
    project: "default",
    config,
    expanded_config: config,
    state: {
      network: {
        eth0: {
          type: "broadcast",
          addresses: addresses.map((a) => ({ ...a, scope: "global" })),
        },
      },
    },
  }) as unknown as LxdInstance;

describe("parseTags", () => {
  it("splits on semicolons, trims and dedupes", () => {
    expect(parseTags("a; b;;a ")).toEqual(["a", "b"]);
  });

  it("returns an empty list for undefined", () => {
    expect(parseTags(undefined)).toEqual([]);
  });
});

describe("serializeTags", () => {
  it("joins with semicolons", () => {
    expect(serializeTags(["a", "b"])).toBe("a;b");
  });
});

describe("parseKeyValues", () => {
  it("parses key=value pairs", () => {
    expect(parseKeyValues("os=#112233;ipv4=#abcdef")).toEqual({
      os: "#112233",
      ipv4: "#abcdef",
    });
  });

  it("ignores malformed entries", () => {
    expect(parseKeyValues("broken;x=1")).toEqual({ x: "1" });
  });
});

describe("serializeKeyValues", () => {
  it("round trips", () => {
    expect(serializeKeyValues({ a: "1", b: "2" })).toBe("a=1;b=2");
  });
});

describe("hashColor", () => {
  it("is deterministic and a hex color", () => {
    expect(hashColor("os")).toBe(hashColor("os"));
    expect(hashColor("os")).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("textColorFor", () => {
  it("uses dark text on light backgrounds", () => {
    expect(textColorFor("#ffffff")).toBe("#000000");
  });

  it("uses light text on dark backgrounds", () => {
    expect(textColorFor("#000000")).toBe("#ffffff");
  });
});

describe("getTagColor", () => {
  const a = make("a", { "user.tags": "os", "user.tag_colors": "os=#123456" });
  const b = make("b", { "user.tags": "os" });
  const c = make("c", { "user.tags": "os", "user.tag_colors": "os=#654321" });

  it("prefers the own color", () => {
    expect(getTagColor("os", a, [a, b, c])).toBe("#123456");
  });

  it("inherits from another instance, first by name", () => {
    expect(getTagColor("os", b, [c, b, a])).toBe("#123456");
  });

  it("falls back to the hash color", () => {
    expect(getTagColor("new", b, [a, b])).toBe(hashColor("new"));
  });
});

describe("getInstanceTagChips", () => {
  it("lists user tags with their colors", () => {
    const a = make("a", {
      "user.tags": "os;web",
      "user.tag_colors": "os=#123456",
    });
    expect(getInstanceTagChips(a, [a])).toEqual([
      { label: "os", color: "#123456", kind: "tag" },
      { label: "web", color: hashColor("web"), kind: "tag" },
    ]);
  });

  it("adds ip addresses when enabled", () => {
    const d = make("d", { "user.ip_tags": "ipv4=#00ff00" }, [
      { family: "inet", address: "192.168.1.5" },
      { family: "inet6", address: "fd00::5" },
    ]);
    expect(getInstanceTagChips(d, [d])).toEqual([
      { label: "192.168.1.5", color: "#00ff00", kind: "ipv4" },
    ]);
  });

  it("has no chips without tags", () => {
    const e = make("e", {}, [{ family: "inet", address: "10.0.0.1" }]);
    expect(getInstanceTagChips(e, [e])).toEqual([]);
  });
});

describe("getKnownTags", () => {
  it("collects distinct tags across instances, sorted, with colors", () => {
    const a = make("a", {
      "user.tags": "web;os",
      "user.tag_colors": "os=#123456",
    });
    const b = make("b", { "user.tags": "os;db" });
    expect(getKnownTags([a, b])).toEqual([
      { tag: "db", color: hashColor("db") },
      { tag: "os", color: "#123456" },
      { tag: "web", color: hashColor("web") },
    ]);
  });
});

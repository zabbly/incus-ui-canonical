import {
  descriptionToText,
  isHtmlDescription,
  sanitizeDescription,
} from "./richDescription";

describe("isHtmlDescription", () => {
  it("detects plain text", () => {
    expect(isHtmlDescription("just a note")).toBe(false);
    expect(isHtmlDescription("a < b and c > d")).toBe(false);
    expect(isHtmlDescription("")).toBe(false);
    expect(isHtmlDescription(undefined)).toBe(false);
  });

  it("detects html", () => {
    expect(isHtmlDescription("<b>bold</b>")).toBe(true);
    expect(isHtmlDescription("<div align='center'>x</div>")).toBe(true);
    expect(isHtmlDescription("text</p>")).toBe(true);
    expect(isHtmlDescription("<IMG SRC='https://x/y.png'>")).toBe(true);
  });

  it("treats angle brackets around words as plain text", () => {
    expect(isHtmlDescription("Contact <me@example.org>")).toBe(false);
    expect(isHtmlDescription("ports <8080> and <9090>")).toBe(false);
    expect(isHtmlDescription("<unknowntag>x</unknowntag>")).toBe(false);
  });
});

describe("sanitizeDescription", () => {
  const payloads = [
    "<img src=x onerror=alert(1)>",
    "<img src='https://example.org/a.png' onerror='alert(1)'>",
    "<a href='javascript:alert(1)'>x</a>",
    "<a href='  JaVaScRiPt:alert(1)'>x</a>",
    "<script>alert(1)</script>",
    "<svg onload=alert(1)>",
    "<iframe src='https://example.org'></iframe>",
    "<form action='https://example.org'><input></form>",
    "<div style='position:fixed;inset:0'>overlay</div>",
    "<p onclick='alert(1)'>x</p>",
    "<a href='data:text/html,<script>alert(1)</script>'>x</a>",
    "<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>",
  ];

  it.each(payloads)("neutralises %s", (payload) => {
    const result = sanitizeDescription(payload).toLowerCase();
    expect(result).not.toContain("<script");
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("onload");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("javascript:");
    expect(result).not.toContain("data:");
    expect(result).not.toContain("<iframe");
    expect(result).not.toContain("<form");
    expect(result).not.toContain("<svg");
    expect(result).not.toContain("style=");
  });

  it("keeps https links and hardens them", () => {
    const result = sanitizeDescription(
      "<a href='https://community-scripts.org'>site</a>",
    );
    expect(result).toContain('href="https://community-scripts.org"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("drops plain http urls", () => {
    const result = sanitizeDescription("<img src='http://example.org/a.png'>");
    expect(result).not.toContain("src=");
  });

  it("keeps https images without referrer", () => {
    const result = sanitizeDescription(
      "<img src='https://img.shields.io/badge/x-y-red' alt='badge'>",
    );
    expect(result).toContain('src="https://img.shields.io/badge/x-y-red"');
    expect(result).toContain('referrerpolicy="no-referrer"');
  });
});

describe("descriptionToText", () => {
  it("returns plain text unchanged", () => {
    expect(descriptionToText("my note")).toBe("my note");
  });

  it("extracts readable text from community-scripts html", () => {
    const html =
      "<div align='center'><a href='https://community-scripts.org'>" +
      "<img src='https://example.org/logo.png' alt='Community-Scripts'></a>" +
      "<h2 style='font-size: 24px'>Paperless-GPT LXC</h2>" +
      "<p><a href='https://community-scripts.org/donate'>" +
      "<img src='https://img.shields.io/x' alt='Sponsoring'></a></p></div>";
    expect(descriptionToText(html)).toBe("Paperless-GPT LXC");
  });

  it("separates blocks", () => {
    expect(descriptionToText("<h2>A</h2><p>B</p>")).toBe("A · B");
  });

  it("never returns markup", () => {
    expect(descriptionToText("<img src=x onerror=alert(1)>hi")).toBe("hi");
  });
});

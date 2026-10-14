import { formatHtml } from "./formatHtml";

describe("formatHtml", () => {
  it("puts blocks on their own lines", () => {
    expect(formatHtml("<p>a</p><p>b</p>")).toBe("<p>a</p>\n<p>b</p>");
  });

  it("indents nested blocks", () => {
    expect(formatHtml("<ul><li><p>a</p></li><li><p>b</p></li></ul>")).toBe(
      "<ul>\n  <li>\n    <p>a</p>\n  </li>\n  <li>\n    <p>b</p>\n  </li>\n</ul>",
    );
  });

  it("keeps inline content on one line", () => {
    const html = '<p><a href="https://x">x</a> <strong>y</strong></p>';
    expect(formatHtml(html)).toBe(html);
  });

  it("keeps attributes of blocks with nested blocks", () => {
    expect(formatHtml('<blockquote class="q"><p>a</p></blockquote>')).toBe(
      '<blockquote class="q">\n  <p>a</p>\n</blockquote>',
    );
  });

  it("keeps pre blocks verbatim", () => {
    const html = "<pre><code>a\n  b</code></pre>";
    expect(formatHtml(html)).toBe(html);
  });

  it("drops whitespace between blocks", () => {
    expect(formatHtml("<p>a</p>\n\n  <p>b</p>")).toBe("<p>a</p>\n<p>b</p>");
  });
});

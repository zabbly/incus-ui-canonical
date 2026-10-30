const BLOCK_TAGS = new Set([
  "article",
  "blockquote",
  "div",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const isBlock = (node: Node): boolean =>
  node.nodeType === Node.ELEMENT_NODE &&
  BLOCK_TAGS.has((node as Element).tagName.toLowerCase());

const openTag = (el: Element): string => {
  const clone = el.cloneNode(false) as Element;
  return clone.outerHTML.replace(/<\/[a-z0-9-]+>$/i, "");
};

const formatNode = (node: Node, depth: number): string => {
  const pad = "  ".repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? "").trim();
    if (!text) {
      return "";
    }
    const span = document.createElement("span");
    span.textContent = text;
    return pad + span.innerHTML;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes);

  // pre is whitespace sensitive, inline only content stays on one line
  if (tag === "pre" || !children.some(isBlock)) {
    return pad + el.outerHTML;
  }

  const inner = children
    .map((child) => formatNode(child, depth + 1))
    .filter((line) => line !== "")
    .join("\n");
  return `${pad}${openTag(el)}\n${inner}\n${pad}</${tag}>`;
};

// Pretty prints html from the visual editor: one block per line, nested
// blocks indented, inline content untouched.
export const formatHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.body.childNodes)
    .map((node) => formatNode(node, 0))
    .filter((line) => line !== "")
    .join("\n");
};

import DOMPurify from "dompurify";

// Tags allowed in instance descriptions. Deliberately small: enough for
// formatted notes (e.g. Proxmox-style "notes" written by community-scripts),
// nothing that can execute code, embed frames or submit forms.
const ALLOWED_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
  "ul",
];

// No "style" (CSS-based UI redressing), no "class" (would pick up the
// app's own styles), no event handlers.
const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "align",
];

// Only https links and images. Blocks javascript:, data:, http: etc.
const SAFE_URL = /^https:\/\//i;

// Only tags from the allow-list count as html, so "<me@example.org>" stays text.
const HTML_PATTERN = new RegExp(
  `<\\/?(?:${ALLOWED_TAGS.join("|")})\\b[^>]*>`,
  "i",
);

let hooksInstalled = false;

const installHooks = () => {
  if (hooksInstalled) {
    return;
  }
  hooksInstalled = true;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    for (const attr of ["href", "src"]) {
      const value = node.getAttribute(attr);
      if (value !== null && !SAFE_URL.test(value.trim())) {
        node.removeAttribute(attr);
      }
    }

    // Links always open in a new tab without leaking the UI origin.
    if (node.tagName === "A" && node.hasAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }

    // Images must not send a referrer to third parties either.
    if (node.tagName === "IMG") {
      node.setAttribute("referrerpolicy", "no-referrer");
      node.setAttribute("loading", "lazy");
    }
  });
};

export const isHtmlDescription = (description?: string): boolean =>
  !!description && HTML_PATTERN.test(description);

export const sanitizeDescription = (description: string): string => {
  installHooks();
  return DOMPurify.sanitize(description, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
};

// Plain text version for places with one truncated line (instance list,
// tooltips). Uses DOMPurify first so no markup is ever parsed live.
export const descriptionToText = (description?: string): string => {
  if (!description) {
    return "";
  }
  if (!isHtmlDescription(description)) {
    return description;
  }

  const clean = DOMPurify.sanitize(description, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    RETURN_DOM: true,
  }) as HTMLElement;

  // Block elements become separators so "<h2>A</h2><p>B</p>" reads "A · B".
  clean
    .querySelectorAll("br, p, div, h1, h2, h3, h4, h5, h6, li, hr")
    .forEach((el) => {
      el.after(" · ");
    });

  return (clean.textContent ?? "")
    .replace(/\s+/g, " ")
    .replace(/(\s*·\s*)+/g, " · ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .trim();
};

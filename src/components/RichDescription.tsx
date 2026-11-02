import { useMemo, type FC } from "react";
import { isHtmlDescription, sanitizeDescription } from "util/richDescription";

interface Props {
  description?: string;
}

// Renders an instance description. Plain text stays plain text (with line
// breaks preserved); HTML is sanitized with a strict allow-list first.
const RichDescription: FC<Props> = ({ description }) => {
  const html = useMemo(
    () =>
      description && isHtmlDescription(description)
        ? sanitizeDescription(description)
        : null,
    [description],
  );

  if (!description) {
    return "-";
  }

  if (html === null) {
    return <span className="rich-description--text">{description}</span>;
  }

  return (
    <div
      className="rich-description"
      // Safe: sanitized with DOMPurify, see util/richDescription.ts
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichDescription;

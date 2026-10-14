import { useState, type FC } from "react";
import { Field, Tabs } from "@canonical/react-components";
import ReactCodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { bespin } from "@uiw/codemirror-theme-bespin";
import RichDescription from "components/RichDescription";
import VisualDescriptionEditor from "components/forms/VisualDescriptionEditor";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
}

type Mode = "visual" | "html" | "preview";

const MODES: { mode: Mode; label: string }[] = [
  { mode: "visual", label: "Visual" },
  { mode: "html", label: "HTML" },
  { mode: "preview", label: "Preview" },
];

// Wysiwyg, html source, or a preview of the sanitized result.
const DescriptionEditor: FC<Props> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  title,
}) => {
  const [mode, setMode] = useState<Mode>("visual");

  return (
    <Field label={label} forId={id}>
      <div className="description-editor" title={title}>
        <Tabs
          className="description-editor__tabs"
          links={MODES.map((item) => ({
            label: item.label,
            active: mode === item.mode,
            onClick: () => {
              setMode(item.mode);
            },
          }))}
        />
        {mode === "visual" && (
          <VisualDescriptionEditor
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}
        {mode === "html" && (
          <ReactCodeMirror
            id={id}
            value={value}
            extensions={[html()]}
            theme={bespin}
            basicSetup={{ lineNumbers: false, foldGutter: false }}
            placeholder={placeholder}
            minHeight="8rem"
            maxHeight="24rem"
            editable={!disabled}
            readOnly={disabled}
            onChange={(text: string) => {
              onChange(text);
            }}
          />
        )}
        {mode === "preview" && (
          <div className="description-editor__preview">
            <RichDescription description={value} />
          </div>
        )}
      </div>
    </Field>
  );
};

export default DescriptionEditor;

import { useState, type FC } from "react";
import { Field, Tabs } from "@canonical/react-components";
import ReactCodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { bespin } from "@uiw/codemirror-theme-bespin";
import RichDescription from "components/RichDescription";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
}

// Html source editor with a preview of the sanitized result.
const DescriptionEditor: FC<Props> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  title,
}) => {
  const [isPreview, setPreview] = useState(false);

  return (
    <Field label={label} forId={id}>
      <div className="description-editor" title={title}>
        <Tabs
          className="description-editor__tabs"
          links={[
            {
              label: "HTML",
              active: !isPreview,
              onClick: () => {
                setPreview(false);
              },
            },
            {
              label: "Preview",
              active: isPreview,
              onClick: () => {
                setPreview(true);
              },
            },
          ]}
        />
        {isPreview ? (
          <div className="description-editor__preview">
            <RichDescription description={value} />
          </div>
        ) : (
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
      </div>
    </Field>
  );
};

export default DescriptionEditor;

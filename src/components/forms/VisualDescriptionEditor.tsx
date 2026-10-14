import type { FC } from "react";
import classnames from "classnames";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Button } from "@canonical/react-components";

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

interface Tool {
  label: string;
  title: string;
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

const askUrl = (label: string, current = ""): string | null => {
  const url = window.prompt(`${label} (https only)`, current);
  return url === null ? null : url.trim();
};

const tools: Tool[] = [
  {
    label: "B",
    title: "Bold",
    isActive: (e) => e.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    label: "I",
    title: "Italic",
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "U",
    title: "Underline",
    isActive: (e) => e.isActive("underline"),
    run: (e) => e.chain().focus().toggleUnderline().run(),
  },
  {
    label: "S",
    title: "Strike-through",
    isActive: (e) => e.isActive("strike"),
    run: (e) => e.chain().focus().toggleStrike().run(),
  },
  {
    label: "H2",
    title: "Heading",
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "H3",
    title: "Subheading",
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "List",
    title: "Bullet list",
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "1. List",
    title: "Numbered list",
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Quote",
    title: "Blockquote",
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Code",
    title: "Code block",
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: "Link",
    title: "Insert or remove link",
    isActive: (e) => e.isActive("link"),
    run: (e) => {
      const current =
        (e.getAttributes("link").href as string | undefined) ?? "";
      const url = askUrl("Link URL", current);
      if (url === null) {
        return;
      }
      if (url === "") {
        e.chain().focus().unsetLink().run();
        return;
      }
      e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    },
  },
  {
    label: "Image",
    title: "Insert image",
    run: (e) => {
      const url = askUrl("Image URL");
      if (url) {
        e.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    label: "Rule",
    title: "Horizontal rule",
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    label: "Undo",
    title: "Undo",
    run: (e) => e.chain().focus().undo().run(),
  },
  {
    label: "Redo",
    title: "Redo",
    run: (e) => e.chain().focus().redo().run(),
  },
];

// Wysiwyg editor. Writes normalized html back on edits only, so viewing
// an existing description leaves it untouched.
const VisualDescriptionEditor: FC<Props> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image.configure({ inline: true }),
    ],
    content: value,
    editable: !disabled,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { class: "rich-description description-editor__visual" },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div>
      <div className="description-editor__toolbar">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            appearance="base"
            className={classnames("u-no-margin--bottom", {
              "description-editor__tool--active": tool.isActive?.(editor),
            })}
            dense
            disabled={disabled}
            title={tool.title}
            type="button"
            onClick={() => {
              tool.run(editor);
            }}
          >
            {tool.label}
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default VisualDescriptionEditor;

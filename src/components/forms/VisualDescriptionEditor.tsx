import { Fragment, type FC } from "react";
import classnames from "classnames";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Button } from "@canonical/react-components";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Strikethrough,
  TextQuote,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

interface Tool {
  icon: LucideIcon;
  title: string;
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

const askUrl = (label: string, current = ""): string | null => {
  const url = window.prompt(`${label} (https only)`, current);
  return url === null ? null : url.trim();
};

const toolGroups: Tool[][] = [
  [
    {
      icon: Bold,
      title: "Bold",
      isActive: (e) => e.isActive("bold"),
      run: (e) => e.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      title: "Italic",
      isActive: (e) => e.isActive("italic"),
      run: (e) => e.chain().focus().toggleItalic().run(),
    },
    {
      icon: Underline,
      title: "Underline",
      isActive: (e) => e.isActive("underline"),
      run: (e) => e.chain().focus().toggleUnderline().run(),
    },
    {
      icon: Strikethrough,
      title: "Strike-through",
      isActive: (e) => e.isActive("strike"),
      run: (e) => e.chain().focus().toggleStrike().run(),
    },
  ],
  [
    {
      icon: Heading2,
      title: "Heading",
      isActive: (e) => e.isActive("heading", { level: 2 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: Heading3,
      title: "Subheading",
      isActive: (e) => e.isActive("heading", { level: 3 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
  ],
  [
    {
      icon: List,
      title: "Bullet list",
      isActive: (e) => e.isActive("bulletList"),
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      title: "Numbered list",
      isActive: (e) => e.isActive("orderedList"),
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: TextQuote,
      title: "Blockquote",
      isActive: (e) => e.isActive("blockquote"),
      run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      icon: Code,
      title: "Code block",
      isActive: (e) => e.isActive("codeBlock"),
      run: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
  ],
  [
    {
      icon: Link,
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
      icon: ImageIcon,
      title: "Insert image",
      run: (e) => {
        const url = askUrl("Image URL");
        if (url) {
          e.chain().focus().setImage({ src: url }).run();
        }
      },
    },
    {
      icon: Minus,
      title: "Horizontal rule",
      run: (e) => e.chain().focus().setHorizontalRule().run(),
    },
  ],
  [
    {
      icon: Undo2,
      title: "Undo",
      run: (e) => e.chain().focus().undo().run(),
    },
    {
      icon: Redo2,
      title: "Redo",
      run: (e) => e.chain().focus().redo().run(),
    },
  ],
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
      <div className="description-editor__toolbar" role="toolbar">
        {toolGroups.map((group, index) => (
          <Fragment key={index}>
            {index > 0 && <span className="description-editor__separator" />}
            {group.map((tool) => (
              <Button
                key={tool.title}
                appearance="base"
                className={classnames(
                  "u-no-margin--bottom description-editor__tool",
                  {
                    "description-editor__tool--active": tool.isActive?.(editor),
                  },
                )}
                dense
                hasIcon
                disabled={disabled}
                title={tool.title}
                aria-label={tool.title}
                type="button"
                onClick={() => {
                  tool.run(editor);
                }}
              >
                <tool.icon size={16} aria-hidden="true" />
              </Button>
            ))}
          </Fragment>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default VisualDescriptionEditor;

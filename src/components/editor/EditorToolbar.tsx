import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Code,
  CodeSquare,
  Link,
  ImageIcon,
  Table,
  Undo2,
  Redo2,
  Highlighter,
} from "lucide-react";
import type { ReactNode } from "react";

interface ToolbarButton {
  label: string;
  icon: ReactNode;
  action: () => void;
  isActive?: boolean;
}

interface EditorToolbarProps {
  editor: Editor | null;
}

/**
 * Formatting toolbar for the TipTap editor.
 * Each button shows an active state when the corresponding mark/node is applied.
 */
export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const groups: ToolbarButton[][] = [
    // History
    [
      {
        label: "Undo",
        icon: <Undo2 size={16} />,
        action: () => editor.chain().focus().undo().run(),
      },
      {
        label: "Redo",
        icon: <Redo2 size={16} />,
        action: () => editor.chain().focus().redo().run(),
      },
    ],
    // Inline marks
    [
      {
        label: "Bold",
        icon: <Bold size={16} />,
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive("bold"),
      },
      {
        label: "Italic",
        icon: <Italic size={16} />,
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive("italic"),
      },
      {
        label: "Underline",
        icon: <Underline size={16} />,
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive("underline"),
      },
      {
        label: "Strikethrough",
        icon: <Strikethrough size={16} />,
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: editor.isActive("strike"),
      },
      {
        label: "Highlight",
        icon: <Highlighter size={16} />,
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: editor.isActive("highlight"),
      },
      {
        label: "Inline Code",
        icon: <Code size={16} />,
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: editor.isActive("code"),
      },
    ],
    // Headings
    [
      {
        label: "Heading 1",
        icon: <Heading1 size={16} />,
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive("heading", { level: 1 }),
      },
      {
        label: "Heading 2",
        icon: <Heading2 size={16} />,
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive("heading", { level: 2 }),
      },
      {
        label: "Heading 3",
        icon: <Heading3 size={16} />,
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive("heading", { level: 3 }),
      },
    ],
    // Lists
    [
      {
        label: "Bullet List",
        icon: <List size={16} />,
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive("bulletList"),
      },
      {
        label: "Ordered List",
        icon: <ListOrdered size={16} />,
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive("orderedList"),
      },
      {
        label: "Task List",
        icon: <ListChecks size={16} />,
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: editor.isActive("taskList"),
      },
    ],
    // Blocks
    [
      {
        label: "Code Block",
        icon: <CodeSquare size={16} />,
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: editor.isActive("codeBlock"),
      },
      {
        label: "Link",
        icon: <Link size={16} />,
        action: () => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        },
        isActive: editor.isActive("link"),
      },
      {
        label: "Image",
        icon: <ImageIcon size={16} />,
        action: () => {
          const url = window.prompt("Enter image URL:");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        },
      },
      {
        label: "Table",
        icon: <Table size={16} />,
        action: () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        isActive: editor.isActive("table"),
      },
    ],
  ];

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Editor formatting">
      {groups.map((group, gi) => (
        <div key={gi} className="toolbar-group">
          {group.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.label}
              aria-label={btn.label}
              aria-pressed={btn.isActive}
              onClick={btn.action}
              className={`toolbar-btn${btn.isActive ? " active" : ""}`}
            >
              {btn.icon}
            </button>
          ))}
          {gi < groups.length - 1 && (
            <span className="toolbar-divider" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

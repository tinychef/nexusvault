import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code,
  Link,
} from "lucide-react";
import { createPortal } from "react-dom";

interface InlineToolbarProps {
  editor: Editor | null;
}

interface ToolbarPos {
  top: number;
  left: number;
}

/**
 * Floating inline toolbar that appears when text is selected.
 * Notion-style: invisible while typing, appears above selection.
 * TipTap v3 compatible (no BubbleMenu React component in v3).
 */
export function InlineToolbar({ editor }: InlineToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<ToolbarPos>({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updateToolbar = () => {
      const { from, to } = editor.state.selection;
      const isTextSelected = !editor.state.selection.empty && from !== to;

      if (!isTextSelected || !editor.isFocused) {
        setVisible(false);
        return;
      }

      // Get selection bounding rect from browser
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setVisible(false);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0) {
        setVisible(false);
        return;
      }

      const toolbarHeight = 44;
      const toolbarWidth = toolbarRef.current?.offsetWidth ?? 220;

      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      let top = rect.top - toolbarHeight - 8 + window.scrollY;

      // Keep within viewport bounds
      left = Math.max(8, Math.min(left, window.innerWidth - toolbarWidth - 8));
      if (top < 8) {
        top = rect.bottom + 8 + window.scrollY;
      }

      setPos({ top, left });
      setVisible(true);
    };

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);
    editor.on("blur", () => {
      // Delay so toolbar button clicks register before hide
      setTimeout(() => {
        if (!toolbarRef.current?.matches(":focus-within")) {
          setVisible(false);
        }
      }, 150);
    });

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);
    };
  }, [editor]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL:", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const buttons = [
    {
      label: "Bold",
      icon: <Bold size={14} />,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: <Italic size={14} />,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "Underline",
      icon: <Underline size={14} />,
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      label: "Strikethrough",
      icon: <Strikethrough size={14} />,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    {
      label: "Highlight",
      icon: <Highlighter size={14} />,
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive("highlight"),
    },
    {
      label: "Code",
      icon: <Code size={14} />,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
    },
    {
      label: "Link",
      icon: <Link size={14} />,
      action: setLink,
      isActive: editor.isActive("link"),
    },
  ];

  const toolbar = (
    <div
      ref={toolbarRef}
      className="inline-toolbar"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 50,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 100ms ease",
      }}
      onMouseDown={(e) => e.preventDefault()} // prevent blur on click
    >
      {buttons.map((btn, i) => (
        <button
          key={i}
          type="button"
          title={btn.label}
          aria-label={btn.label}
          aria-pressed={btn.isActive}
          onClick={btn.action}
          className={`inline-toolbar-btn${btn.isActive ? " active" : ""}`}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );

  return createPortal(toolbar, document.body);
}

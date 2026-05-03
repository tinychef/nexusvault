import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { common, createLowlight } from "lowlight";
import { LoroDoc } from "loro-crdt";
import { LoroSyncPlugin, LoroUndoPlugin } from "loro-prosemirror";
import { useEditorStore } from "@stores/editor";
import { useDocument } from "@hooks/useDocument";
import { EditorToolbar } from "./EditorToolbar";
import { SlashCommands } from "./extensions/SlashCommands";
import { getSuggestionItems, renderSuggestion } from "./extensions/suggestion";
import { WikiLink } from "./extensions/WikiLink";
import { getWikiSuggestionItems, renderWikiSuggestion } from "./extensions/wikiSuggestion";

const lowlight = createLowlight(common);

/** Debounce interval for auto-save (ms) */
const AUTOSAVE_DELAY = 2000;

interface EditorProps {
  /** ID of the document to edit */
  docId: string;
  /** LoroDoc instance pre-loaded by the parent */
  loroDoc: LoroDoc;
}

/**
 * Main block editor component backed by TipTap + Loro CRDT.
 *
 * - Syncs editor state bidirectionally with the LoroDoc via LoroSyncPlugin
 * - Undo/redo is managed by LoroUndoPlugin (CRDT-aware)
 * - Auto-saves to disk 2 seconds after each keystroke
 */
export function Editor({ docId, loroDoc }: EditorProps) {
  const { setWordCount, markTabDirty } = useEditorStore();
  const { saveDocument } = useDocument();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // LoroSyncPlugin handles its own history
        history: false,
        codeBlock: false,
      } as any),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image,
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight.configure({ multicolor: true }),
      Underline,
      Typography,
      Placeholder.configure({ placeholder: "Start writing… (type / for commands)" }),
      SlashCommands.configure({
        suggestion: {
          items: getSuggestionItems,
          render: renderSuggestion,
        },
      }),
      WikiLink.configure({
        suggestion: {
          items: getWikiSuggestionItems,
          render: renderWikiSuggestion,
        },
      }),
    ],
    editorProps: {
      attributes: { class: "tiptap" },
    },
    onCreate: ({ editor: e }) => {
      // Attach Loro sync after editor is initialized
      // @ts-expect-error LoroSyncPlugin typing expects a specific ProseMirror version
      const loroSync = LoroSyncPlugin({ doc: loroDoc });
      const loroUndo = LoroUndoPlugin({ doc: loroDoc });
      
      const view = e.view;
      const state = view.state;
      view.dispatch(state.tr.setMeta("addPlugin", loroSync).setMeta("addPlugin", loroUndo));
    },
    onUpdate: ({ editor: e }) => {
      // Update word count
      const text = e.getText();
      const count = text.split(/\s+/).filter(Boolean).length;
      setWordCount(count);
      markTabDirty(docId, true);

      // Debounced auto-save
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        await saveDocument(docId, loroDoc, count);
      }, AUTOSAVE_DELAY);
    },
  });

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return (
    <div className="editor-wrapper">
      <EditorToolbar editor={editor} />
      <div className="editor-scroll-area">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

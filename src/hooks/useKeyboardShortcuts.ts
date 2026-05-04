import { useEffect } from "react";
import { useEditorStore } from "@stores/editor";
import { useDocument } from "./useDocument";

interface ShortcutOptions {
  onQuickSwitcher: () => void;
}

/**
 * Registers global keyboard shortcuts for the app.
 * Editor-level shortcuts (bold, italic, etc.) are handled by TipTap directly.
 */
export function useKeyboardShortcuts({ onQuickSwitcher }: ShortcutOptions) {
  const { toggleSidebar } = useEditorStore();
  const { createDocument } = useDocument();

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case "p":
          e.preventDefault();
          onQuickSwitcher();
          break;

        case "n":
          e.preventDefault();
          await createDocument("Untitled");
          break;

        case "\\":
          e.preventDefault();
          toggleSidebar();
          break;

        case "s":
          // Cmd+S is a no-op — auto-save handles persistence.
          // We prevent the browser download dialog from opening.
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onQuickSwitcher, createDocument, toggleSidebar]);
}

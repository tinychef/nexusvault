import { create } from "zustand";
import type { EditorTab } from "@/types";

type RightPanelView = "backlinks" | "graph" | "ai";

interface EditorState {
  // ── State ─────────────────────────────────────────────────────────────────
  tabs: EditorTab[];
  activeTabId: string | null;
  isSaving: boolean;
  wordCount: number;
  lastSavedAt: number | null;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelView: RightPanelView | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Open a document tab (no-op if already open) */
  openTab: (docId: string, title: string) => void;
  /** Close a tab and shift focus to the adjacent tab */
  closeTab: (docId: string) => void;
  /** Switch the active editor to a given tab */
  setActiveTab: (docId: string) => void;
  /** Mark whether a tab has unsaved changes */
  markTabDirty: (docId: string, isDirty: boolean) => void;
  /** Update tab title (e.g. after rename) */
  updateTabTitle: (docId: string, title: string) => void;
  /** Set the saving indicator */
  setIsSaving: (saving: boolean) => void;
  /** Update the live word count display */
  setWordCount: (count: number) => void;
  /** Record the last auto-save timestamp */
  setLastSavedAt: (timestamp: number) => void;
  /** Toggle sidebar visibility */
  toggleSidebar: () => void;
  /** Toggle right panel; optionally switch to a specific view */
  toggleRightPanel: (view?: RightPanelView) => void;
}

/**
 * Global Zustand store for editor UI state.
 * Manages open tabs, word count, auto-save status, and panel visibility.
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isSaving: false,
  wordCount: 0,
  lastSavedAt: null,
  sidebarOpen: true,
  rightPanelOpen: false,
  rightPanelView: null,

  openTab: (docId, title) => {
    const { tabs } = get();
    const exists = tabs.some((t) => t.docId === docId);
    if (exists) {
      set({ activeTabId: docId });
      return;
    }
    set({
      tabs: [...tabs, { docId, title, isDirty: false }],
      activeTabId: docId,
    });
  },

  closeTab: (docId) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.docId === docId);
    const nextTabs = tabs.filter((t) => t.docId !== docId);

    let nextActiveId: string | null = activeTabId;
    if (activeTabId === docId) {
      // Prefer next tab; fall back to previous; null if list is empty
      const sibling = nextTabs[idx] ?? nextTabs[idx - 1] ?? null;
      nextActiveId = sibling?.docId ?? null;
    }

    set({ tabs: nextTabs, activeTabId: nextActiveId });
  },

  setActiveTab: (docId) => set({ activeTabId: docId }),

  markTabDirty: (docId, isDirty) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.docId === docId ? { ...t, isDirty } : t)),
    })),

  updateTabTitle: (docId, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.docId === docId ? { ...t, title } : t)),
    })),

  setIsSaving: (isSaving) => set({ isSaving }),

  setWordCount: (wordCount) => set({ wordCount }),

  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleRightPanel: (view) => {
    const { rightPanelOpen, rightPanelView } = get();
    if (!view || view === rightPanelView) {
      set({ rightPanelOpen: !rightPanelOpen });
    } else {
      set({ rightPanelOpen: true, rightPanelView: view });
    }
  },
}));

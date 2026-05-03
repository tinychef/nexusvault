import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "../editor";

describe("useEditorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
      isSaving: false,
      wordCount: 0,
      lastSavedAt: null,
      sidebarOpen: true,
      rightPanelOpen: false,
      rightPanelView: null,
    });
  });

  it("should open a new tab", () => {
    useEditorStore.getState().openTab("doc-1", "Doc 1");
    const state = useEditorStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].docId).toBe("doc-1");
    expect(state.activeTabId).toBe("doc-1");
  });

  it("should not duplicate tabs", () => {
    const store = useEditorStore.getState();
    store.openTab("doc-1", "Doc 1");
    store.openTab("doc-1", "Doc 1");
    expect(useEditorStore.getState().tabs.length).toBe(1);
  });

  it("should close a tab", () => {
    const store = useEditorStore.getState();
    store.openTab("doc-1", "Doc 1");
    store.openTab("doc-2", "Doc 2");
    store.closeTab("doc-1");
    
    const state = useEditorStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].docId).toBe("doc-2");
    // Should fallback to doc-2 as active
    expect(state.activeTabId).toBe("doc-2");
  });

  it("should mark tab as dirty", () => {
    const store = useEditorStore.getState();
    store.openTab("doc-1", "Doc 1");
    store.markTabDirty("doc-1", true);
    
    expect(useEditorStore.getState().tabs[0].isDirty).toBe(true);
  });

  it("should toggle sidebar", () => {
    expect(useEditorStore.getState().sidebarOpen).toBe(true);
    useEditorStore.getState().toggleSidebar();
    expect(useEditorStore.getState().sidebarOpen).toBe(false);
  });

  it("should set active tab", () => {
    useEditorStore.getState().setActiveTab("doc-2");
    expect(useEditorStore.getState().activeTabId).toBe("doc-2");
  });

  it("should update tab title", () => {
    const store = useEditorStore.getState();
    store.openTab("doc-1", "Doc 1");
    store.updateTabTitle("doc-1", "New Title");
    expect(useEditorStore.getState().tabs[0].title).toBe("New Title");
  });

  it("should set isSaving", () => {
    useEditorStore.getState().setIsSaving(true);
    expect(useEditorStore.getState().isSaving).toBe(true);
  });

  it("should set word count", () => {
    useEditorStore.getState().setWordCount(42);
    expect(useEditorStore.getState().wordCount).toBe(42);
  });

  it("should set last saved at", () => {
    useEditorStore.getState().setLastSavedAt(1000);
    expect(useEditorStore.getState().lastSavedAt).toBe(1000);
  });

  it("should toggle right panel without view", () => {
    const store = useEditorStore.getState();
    store.toggleRightPanel();
    expect(useEditorStore.getState().rightPanelOpen).toBe(true);
    
    useEditorStore.getState().toggleRightPanel();
    expect(useEditorStore.getState().rightPanelOpen).toBe(false);
  });

  it("should toggle right panel with specific view", () => {
    const store = useEditorStore.getState();
    store.toggleRightPanel("backlinks");
    expect(useEditorStore.getState().rightPanelOpen).toBe(true);
    expect(useEditorStore.getState().rightPanelView).toBe("backlinks");
    
    useEditorStore.getState().toggleRightPanel("backlinks");
    expect(useEditorStore.getState().rightPanelOpen).toBe(false);

    useEditorStore.getState().toggleRightPanel("graph");
    expect(useEditorStore.getState().rightPanelOpen).toBe(true);
    expect(useEditorStore.getState().rightPanelView).toBe("graph");
  });
});

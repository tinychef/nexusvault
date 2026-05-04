import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "../editor";

describe("useEditorStore extended", () => {
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

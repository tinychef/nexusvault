import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDocument } from "../useDocument";
import { renderHook, act } from "@testing-library/react";
import { useVaultStore } from "@stores/vault";
import { useEditorStore } from "@stores/editor";

vi.mock("@lib/loro/doc-manager", () => ({
  createNewDocument: vi.fn().mockReturnValue({}),
  saveDocument: vi.fn().mockResolvedValue(undefined),
  loadDocument: vi.fn().mockResolvedValue({}),
}));

vi.mock("@lib/db/queries", () => ({
  insertDocument: vi.fn().mockResolvedValue(undefined),
  softDeleteDocument: vi.fn().mockResolvedValue(undefined),
  updateDocumentMeta: vi.fn().mockResolvedValue(undefined),
}));

import { createNewDocument, saveDocument, loadDocument } from "@lib/loro/doc-manager";
import { insertDocument, softDeleteDocument, updateDocumentMeta } from "@lib/db/queries";

describe("useDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVaultStore.setState({ documents: [], activeDocId: null });
    useEditorStore.setState({ tabs: [], activeTabId: null });
  });

  it("should create a new document", async () => {
    const { result } = renderHook(() => useDocument());
    
    await act(async () => {
      await result.current.createDocument("New Doc");
    });

    expect(createNewDocument).toHaveBeenCalled();
    expect(saveDocument).toHaveBeenCalled();
    expect(insertDocument).toHaveBeenCalled();
    
    const vaultState = useVaultStore.getState();
    expect(vaultState.documents.length).toBe(1);
    expect(vaultState.documents[0].title).toBe("New Doc");

    const editorState = useEditorStore.getState();
    expect(editorState.tabs.length).toBe(1);
    expect(editorState.activeTabId).toBe(vaultState.documents[0].id);
  });

  it("should open an existing document", async () => {
    const { result } = renderHook(() => useDocument());
    
    await act(async () => {
      await result.current.openDocument("doc-1", "Test Doc");
    });

    expect(loadDocument).toHaveBeenCalledWith("doc-1");
    
    const editorState = useEditorStore.getState();
    expect(editorState.tabs.length).toBe(1);
    expect(editorState.activeTabId).toBe("doc-1");
  });

  it("should save a document", async () => {
    const { result } = renderHook(() => useDocument());
    
    await act(async () => {
      // @ts-expect-error Mocked LoroDoc
      await result.current.saveDocument("doc-1", {}, 150);
    });

    expect(saveDocument).toHaveBeenCalled();
    expect(updateDocumentMeta).toHaveBeenCalledWith("doc-1", expect.objectContaining({ wordCount: 150 }));
  });

  it("should delete a document", async () => {
    useVaultStore.setState({ 
      documents: [{ id: "doc-1", title: "Test", path: "", createdAt: 0, updatedAt: 0, wordCount: 0, loroFile: "", isDeleted: false }]
    });
    useEditorStore.setState({
      tabs: [{ docId: "doc-1", title: "Test", isDirty: false }],
      activeTabId: "doc-1"
    });

    const { result } = renderHook(() => useDocument());
    
    await act(async () => {
      await result.current.deleteDocument("doc-1");
    });

    expect(softDeleteDocument).toHaveBeenCalledWith("doc-1");
    
    expect(useVaultStore.getState().documents.length).toBe(0);
    expect(useEditorStore.getState().tabs.length).toBe(0);
  });
});

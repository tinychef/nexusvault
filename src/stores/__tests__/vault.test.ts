import { describe, it, expect, beforeEach } from "vitest";
import { useVaultStore } from "../vault";
import type { VaultDocument } from "@/types";

describe("useVaultStore", () => {
  beforeEach(() => {
    useVaultStore.setState({
      documents: [],
      activeDocId: null,
      vaultConfig: null,
      isLoading: false,
      error: null,
    });
  });

  const mockDoc: VaultDocument = {
    id: "doc-1",
    title: "Test Doc",
    path: "",
    createdAt: 1000,
    updatedAt: 1000,
    wordCount: 10,
    loroFile: "docs/doc-1.loro",
    isDeleted: false,
  };

  it("should initialize with empty state", () => {
    const state = useVaultStore.getState();
    expect(state.documents).toEqual([]);
    expect(state.activeDocId).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("should set documents", () => {
    useVaultStore.getState().setDocuments([mockDoc]);
    expect(useVaultStore.getState().documents).toEqual([mockDoc]);
  });

  it("should add a document", () => {
    useVaultStore.getState().addDocument(mockDoc);
    expect(useVaultStore.getState().documents).toContainEqual(mockDoc);
  });

  it("should remove a document", () => {
    useVaultStore.getState().setDocuments([mockDoc]);
    useVaultStore.getState().removeDocument("doc-1");
    expect(useVaultStore.getState().documents).toEqual([]);
  });

  it("should update a document", () => {
    useVaultStore.getState().setDocuments([mockDoc]);
    useVaultStore.getState().updateDocument("doc-1", { title: "Updated Title" });
    const docs = useVaultStore.getState().documents;
    expect(docs[0].title).toBe("Updated Title");
    expect(docs[0].wordCount).toBe(10); // Other properties remain
  });
});

describe("useVaultStore extended", () => {
  beforeEach(() => {
    useVaultStore.setState({
      documents: [],
      activeDocId: null,
      vaultConfig: null,
      isLoading: false,
      error: null,
    });
  });

  it("should set active document", () => {
    useVaultStore.getState().setActiveDocument("doc-1");
    expect(useVaultStore.getState().activeDocId).toBe("doc-1");
  });

  it("should set vault config", () => {
    const config = {
      name: "My Vault",
      path: "/test/path",
      createdAt: 1000,
      syncEnabled: false,
      encryptionEnabled: false,
    };
    useVaultStore.getState().setVaultConfig(config);
    expect(useVaultStore.getState().vaultConfig).toEqual(config);
  });

  it("should set loading state", () => {
    useVaultStore.getState().setLoading(true);
    expect(useVaultStore.getState().isLoading).toBe(true);
  });

  it("should set error state", () => {
    useVaultStore.getState().setError("Test Error");
    expect(useVaultStore.getState().error).toBe("Test Error");

    useVaultStore.getState().setError(null);
    expect(useVaultStore.getState().error).toBeNull();
  });

  it("should remove document and clear active if it matches", () => {
    const doc = {
      id: "doc-1",
      title: "Test",
      path: "",
      createdAt: 0,
      updatedAt: 0,
      wordCount: 0,
      loroFile: "",
      isDeleted: false,
    };
    useVaultStore.setState({ documents: [doc], activeDocId: "doc-1" });
    useVaultStore.getState().removeDocument("doc-1");

    expect(useVaultStore.getState().documents.length).toBe(0);
    expect(useVaultStore.getState().activeDocId).toBeNull();
  });

  it("should keep active doc id if removed document doesn't match", () => {
    const doc1 = {
      id: "doc-1",
      title: "Test",
      path: "",
      createdAt: 0,
      updatedAt: 0,
      wordCount: 0,
      loroFile: "",
      isDeleted: false,
    };
    const doc2 = {
      id: "doc-2",
      title: "Test 2",
      path: "",
      createdAt: 0,
      updatedAt: 0,
      wordCount: 0,
      loroFile: "",
      isDeleted: false,
    };

    useVaultStore.setState({ documents: [doc1, doc2], activeDocId: "doc-1" });
    useVaultStore.getState().removeDocument("doc-2");

    expect(useVaultStore.getState().documents.length).toBe(1);
    expect(useVaultStore.getState().activeDocId).toBe("doc-1");
  });
});

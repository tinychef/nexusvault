import { describe, it, expect, beforeEach } from "vitest";
import { useVaultStore } from "../vault";

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
    const doc = { id: "doc-1", title: "Test", path: "", createdAt: 0, updatedAt: 0, wordCount: 0, loroFile: "", isDeleted: false };
    useVaultStore.setState({ documents: [doc], activeDocId: "doc-1" });
    useVaultStore.getState().removeDocument("doc-1");
    
    expect(useVaultStore.getState().documents.length).toBe(0);
    expect(useVaultStore.getState().activeDocId).toBeNull();
  });

  it("should keep active doc id if removed document doesn't match", () => {
    const doc1 = { id: "doc-1", title: "Test", path: "", createdAt: 0, updatedAt: 0, wordCount: 0, loroFile: "", isDeleted: false };
    const doc2 = { id: "doc-2", title: "Test 2", path: "", createdAt: 0, updatedAt: 0, wordCount: 0, loroFile: "", isDeleted: false };
    
    useVaultStore.setState({ documents: [doc1, doc2], activeDocId: "doc-1" });
    useVaultStore.getState().removeDocument("doc-2");
    
    expect(useVaultStore.getState().documents.length).toBe(1);
    expect(useVaultStore.getState().activeDocId).toBe("doc-1");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNewDocument, saveDocument, loadDocument, documentExists } from "../doc-manager";
import { LoroDoc } from "loro-crdt";
import { writeFile, exists } from "@tauri-apps/plugin-fs";
import { readFile } from "@tauri-apps/plugin-fs";

describe("doc-manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new empty document", () => {
    const doc = createNewDocument("test-id");
    expect(doc).toBeInstanceOf(LoroDoc);
    expect(doc.getText("content")).toBeDefined();
  });

  it("should save a document to the filesystem", async () => {
    const doc = new LoroDoc();
    await saveDocument("test-id", doc);
    
    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(
      "docs/test-id.loro",
      expect.any(Uint8Array),
      expect.objectContaining({ baseDir: expect.any(Number) })
    );
  });

  it("should load a document if it exists", async () => {
    const validDoc = new LoroDoc();
    validDoc.getText("content").insert(0, "Hello");
    const snapshot = new Uint8Array(validDoc.export({ mode: "snapshot" }));
    
    vi.mocked(exists).mockResolvedValueOnce(true);
    vi.mocked(readFile).mockResolvedValueOnce(snapshot);

    const doc = await loadDocument("test-id");
    
    expect(doc).toBeInstanceOf(LoroDoc);
    expect(doc.getText("content").toString()).toBe("Hello");
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("should throw when loading a non-existent document", async () => {
    vi.mocked(exists).mockResolvedValueOnce(false);
    
    await expect(loadDocument("missing")).rejects.toThrow(/not found/);
    expect(readFile).not.toHaveBeenCalled();
  });

  it("should check if document exists", async () => {
    vi.mocked(exists).mockResolvedValueOnce(true);
    const result = await documentExists("test-id");
    
    expect(result).toBe(true);
    expect(exists).toHaveBeenCalledWith(
      "docs/test-id.loro",
      expect.objectContaining({ baseDir: expect.any(Number) })
    );
  });
});

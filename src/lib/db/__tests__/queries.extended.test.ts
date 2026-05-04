import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDocumentById,
  getAllDocuments,
  updateDocumentMeta,
  softDeleteDocument,
  insertLink,
  insertTag,
  getTagsForDocument,
  getDocumentsByTag,
  insertDocument,
} from "../queries";
import { getDatabase } from "../schema";

vi.mock("../schema", () => ({
  getDatabase: vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue(true),
    select: vi.fn(),
  }),
}));

describe("Extended DB Queries", () => {
  let mockDb: any;

  beforeEach(async () => {
    mockDb = await getDatabase();
    vi.mocked(mockDb.select).mockClear();
    vi.mocked(mockDb.execute).mockClear();
  });

  const mockRawDoc = {
    id: "1",
    title: "Test",
    path: "",
    created_at: 100,
    updated_at: 100,
    word_count: 5,
    loro_file: "test.loro",
    is_deleted: 0,
  };

  it("should insert a document", async () => {
    await insertDocument({
      id: "1",
      title: "Test",
      path: "",
      createdAt: 100,
      updatedAt: 100,
      wordCount: 5,
      loroFile: "test.loro",
      isDeleted: false,
    });

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO documents"),
      expect.arrayContaining(["1", "Test", 0]),
    );
  });

  it("should get a document by id", async () => {
    vi.mocked(mockDb.select).mockResolvedValueOnce([mockRawDoc]);

    const doc = await getDocumentById("1");
    expect(doc?.title).toBe("Test");
    expect(doc?.isDeleted).toBe(false);
  });

  it("should return null for non-existent document", async () => {
    vi.mocked(mockDb.select).mockResolvedValueOnce([]);

    const doc = await getDocumentById("999");
    expect(doc).toBeNull();
  });

  it("should get all documents", async () => {
    vi.mocked(mockDb.select).mockResolvedValueOnce([mockRawDoc]);

    const docs = await getAllDocuments();
    expect(docs.length).toBe(1);
    expect(docs[0].title).toBe("Test");
  });

  it("should update document metadata", async () => {
    await updateDocumentMeta("1", { title: "Updated", wordCount: 10 });

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE documents"),
      expect.arrayContaining(["Updated", null, 10]),
    );
  });

  it("should soft delete document", async () => {
    await softDeleteDocument("1");

    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE documents SET is_deleted = 1"),
      expect.arrayContaining(["1"]),
    );
  });

  it("should insert a link", async () => {
    await insertLink("A", "B", "test");
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR IGNORE INTO links"),
      ["A", "B", "test"],
    );
  });

  it("should insert a tag", async () => {
    await insertTag("1", "test-tag");
    expect(mockDb.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT OR IGNORE INTO tags"),
      ["1", "test-tag"],
    );
  });

  it("should get tags for a document", async () => {
    vi.mocked(mockDb.select).mockResolvedValueOnce([{ tag: "tag1" }, { tag: "tag2" }]);

    const tags = await getTagsForDocument("1");
    expect(tags).toEqual(["tag1", "tag2"]);
  });

  it("should get documents by tag", async () => {
    vi.mocked(mockDb.select).mockResolvedValueOnce([mockRawDoc]);

    const docs = await getDocumentsByTag("tag1");
    expect(docs.length).toBe(1);
    expect(docs[0].id).toBe("1");
  });
});

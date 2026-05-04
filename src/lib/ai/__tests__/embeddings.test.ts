import { describe, it, expect, vi, beforeEach } from "vitest";
import { embedText, searchSemantic, upsertEmbedding } from "../embeddings";
import { getDatabase } from "@lib/db/schema";

vi.mock("@lib/db/schema", () => ({
  getDatabase: vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue(true),
    select: vi.fn(),
  }),
}));

describe("embedText", () => {
  it("returns a numeric array of length 512", async () => {
    const vec = await embedText("hello world");
    expect(Array.isArray(vec)).toBe(true);
    expect(vec).toHaveLength(512);
    vec.forEach((v) => expect(typeof v).toBe("number"));
  });

  it("is deterministic for the same input", async () => {
    const a = await embedText("knowledge management");
    const b = await embedText("knowledge management");
    expect(a).toEqual(b);
  });

  it("produces different vectors for different inputs", async () => {
    const a = await embedText("apples");
    const b = await embedText("quantum physics");
    expect(a).not.toEqual(b);
  });

  it("returns a zero-filled (then normalized) vector for empty string", async () => {
    const vec = await embedText("");
    expect(vec).toHaveLength(512);
  });

  it("returns a unit-length vector (L2 norm ≈ 1 for non-empty input)", async () => {
    const vec = await embedText("test input");
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeCloseTo(1, 5);
  });
});

describe("searchSemantic", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;

  beforeEach(async () => {
    mockDb = await getDatabase();
    vi.mocked(mockDb.select).mockClear();
  });

  it("returns results sorted by similarity score descending", async () => {
    const queryVec = await embedText("test query");
    vi.mocked(mockDb.select).mockResolvedValueOnce([
      { doc_id: "a", vector_json: JSON.stringify(queryVec), title: "Perfect match" },
      {
        doc_id: "b",
        vector_json: JSON.stringify(new Array(512).fill(0)),
        title: "No match",
      },
    ]);

    const results = await searchSemantic("test query", 2);
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].docId).toBe("a");
  });

  it("respects topK limit", async () => {
    const vec = await embedText("x");
    vi.mocked(mockDb.select).mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) => ({
        doc_id: String(i),
        vector_json: JSON.stringify(vec),
        title: `Doc ${i}`,
      })),
    );

    const results = await searchSemantic("x", 3);
    expect(results).toHaveLength(3);
  });

  it("returns empty array when no embeddings exist", async () => {
    vi.mocked(mockDb.select).mockResolvedValueOnce([]);
    const results = await searchSemantic("anything");
    expect(results).toEqual([]);
  });
});

describe("upsertEmbedding", () => {
  it("calls db.execute with INSERT OR IGNORE ... ON CONFLICT", async () => {
    const db = await getDatabase();
    await upsertEmbedding("doc-1", "some content");
    expect(vi.mocked(db.execute)).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO embeddings"),
      expect.arrayContaining(["doc-1"]),
    );
  });
});

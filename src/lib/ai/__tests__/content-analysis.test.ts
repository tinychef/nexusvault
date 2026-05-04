import { describe, it, expect, vi, beforeEach } from "vitest";
import { suggestTags, quickSummary } from "../content-analysis";
import type { AIProvider } from "@/types";

const mockProvider: AIProvider = {
  name: "claude",
  apiKey: "test-key",
  model: "claude-sonnet-4-6",
};

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeClaudeResponse(text: string) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ content: [{ text }] }),
  });
}

beforeEach(() => {
  mockFetch.mockClear();
});

describe("suggestTags", () => {
  it("returns up to 3 tags parsed from comma-separated response", async () => {
    mockFetch.mockResolvedValueOnce(makeClaudeResponse("programming, productivity, tools"));
    const tags = await suggestTags("A note about coding tools.", mockProvider);
    expect(tags).toEqual(["programming", "productivity", "tools"]);
  });

  it("strips leading # from tags", async () => {
    mockFetch.mockResolvedValueOnce(makeClaudeResponse("#ai, #rag, #search"));
    const tags = await suggestTags("RAG notes.", mockProvider);
    expect(tags[0]).toBe("ai");
  });

  it("returns empty array for empty content without calling LLM", async () => {
    const tags = await suggestTags("   ", mockProvider);
    expect(tags).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("normalises spaces to hyphens", async () => {
    mockFetch.mockResolvedValueOnce(makeClaudeResponse("knowledge management, note taking, tools"));
    const tags = await suggestTags("My notes.", mockProvider);
    expect(tags).toContain("knowledge-management");
  });
});

describe("quickSummary", () => {
  it("returns the LLM response as-is", async () => {
    const summary = "A brief note about building local-first apps.";
    mockFetch.mockResolvedValueOnce(makeClaudeResponse(summary));
    const result = await quickSummary("A long note about local-first apps.", mockProvider);
    expect(result).toBe(summary);
  });

  it("returns empty string for empty content without calling LLM", async () => {
    const result = await quickSummary("", mockProvider);
    expect(result).toBe("");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws when LLM returns non-ok status", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(quickSummary("content", mockProvider)).rejects.toThrow("401");
  });
});

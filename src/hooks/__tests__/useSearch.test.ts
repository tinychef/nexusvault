import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSearch } from "../useSearch";
import { renderHook, act } from "@testing-library/react";
import { searchDocumentsFTS } from "@lib/db/queries";

// Mock the queries module
vi.mock("@lib/db/queries", () => ({
  searchDocumentsFTS: vi.fn(),
}));

describe("useSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with empty state", () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should clear search when query is empty", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search("   ");
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it("should debounce search requests", async () => {
    const mockResults = [{ docId: "1", title: "Test", snippet: "Test", score: -1 }];
    vi.mocked(searchDocumentsFTS).mockResolvedValueOnce(mockResults);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search("test");
      result.current.search("test 2");
      result.current.search("test 3");
    });

    expect(result.current.isSearching).toBe(true);
    expect(searchDocumentsFTS).not.toHaveBeenCalled();

    // Fast-forward debounce timer (300ms)
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(searchDocumentsFTS).toHaveBeenCalledTimes(1);
    expect(searchDocumentsFTS).toHaveBeenCalledWith("test 3");
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.isSearching).toBe(false);
  });
});

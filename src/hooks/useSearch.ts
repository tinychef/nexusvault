import { useState, useCallback, useRef } from "react";
import { searchDocumentsFTS } from "@lib/db/queries";
import type { SearchResult } from "@/types";

/** Debounce delay in milliseconds for FTS5 queries */
const DEBOUNCE_MS = 300;

/**
 * Custom hook for debounced full-text search.
 * Wraps the FTS5 query with loading state and automatic debouncing.
 */
export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Triggers a debounced FTS5 search. Clears results when query is empty.
   */
  const search = useCallback((query: string): void => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    debounceTimer.current = setTimeout(async () => {
      try {
        const hits = await searchDocumentsFTS(query);
        setResults(hits);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  /** Clears the current search results and resets state */
  const clearSearch = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setResults([]);
    setIsSearching(false);
    setError(null);
  }, []);

  return { search, clearSearch, results, isSearching, error };
}

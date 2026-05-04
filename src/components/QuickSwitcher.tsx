import { useState, useEffect, useRef, useCallback } from "react";
import { Search, File, X } from "lucide-react";
import { useVaultStore } from "@stores/vault";
import { useDocument } from "@hooks/useDocument";
import { searchDocumentsFTS } from "@lib/db/queries";
import type { VaultDocument, SearchResult } from "@/types";

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A Cmd+P / Ctrl+P modal for quickly finding and opening documents.
 * Filters locally by title first, then falls back to FTS5 for content search.
 */
export function QuickSwitcher({ isOpen, onClose }: QuickSwitcherProps) {
  const { documents } = useVaultStore();
  const { openDocument } = useDocument();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ftsResults, setFtsResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter documents by title (instant, local)
  const titleMatches: VaultDocument[] = query.trim()
    ? documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
    : documents.slice(0, 20); // Show recent docs when no query

  // Merge title matches + FTS results (deduplicated)
  const titleIds = new Set(titleMatches.map((d) => d.id));
  const extraFts =
    query.trim().length < 2 ? [] : ftsResults.filter((r) => !titleIds.has(r.docId));

  const totalResults = titleMatches.length + extraFts.length;
  const maxIndex = Math.max(totalResults - 1, 0);
  const activeIndex = Math.min(selectedIndex, maxIndex);

  const closeModal = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    setFtsResults([]);
    onClose();
  }, [onClose]);

  // Debounced FTS search for content matches
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const hits = await searchDocumentsFTS(query);
        setFtsResults(hits);
      } catch {
        setFtsResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[activeIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = useCallback(
    async (docId: string, title: string) => {
      await openDocument(docId, title);
      closeModal();
    },
    [closeModal, openDocument],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, maxIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Determine which result is selected
      if (activeIndex < titleMatches.length) {
        const doc = titleMatches[activeIndex];
        handleSelect(doc.id, doc.title);
      } else {
        const ftsItem = extraFts[activeIndex - titleMatches.length];
        if (ftsItem) {
          handleSelect(ftsItem.docId, ftsItem.title);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-switcher-overlay" onClick={closeModal}>
      <div
        className="quick-switcher"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Quick Switcher"
      >
        {/* Search input */}
        <div className="qs-input-row">
          <Search size={16} className="qs-search-icon" />
          <input
            ref={inputRef}
            id="quick-switcher-input"
            type="text"
            className="qs-input"
            placeholder="Open a note…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Search documents"
          />
          {query && (
            <button
              type="button"
              className="icon-btn-sm"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                setFtsResults([]);
              }}
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results list */}
        <div className="qs-results" ref={listRef} role="listbox">
          {/* Title matches */}
          {titleMatches.map((doc, i) => (
            <button
              key={doc.id}
              type="button"
              className={`qs-result-item${i === activeIndex ? " selected" : ""}`}
              onClick={() => handleSelect(doc.id, doc.title)}
              role="option"
              aria-selected={i === activeIndex}
            >
              <File size={14} />
              <span className="qs-result-title">{doc.title}</span>
            </button>
          ))}

          {/* FTS content matches (deduplicated) */}
          {extraFts.length > 0 && (
            <>
              <div className="qs-divider">Content matches</div>
              {extraFts.map((result, i) => {
                const globalIndex = titleMatches.length + i;
                return (
                  <button
                    key={result.docId}
                    type="button"
                    className={`qs-result-item${globalIndex === activeIndex ? " selected" : ""}`}
                    onClick={() => handleSelect(result.docId, result.title)}
                    role="option"
                    aria-selected={globalIndex === activeIndex}
                  >
                    <File size={14} />
                    <div className="qs-result-content">
                      <span className="qs-result-title">{result.title}</span>
                      <span
                        className="qs-result-snippet"
                        dangerouslySetInnerHTML={{ __html: result.snippet }}
                      />
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {totalResults === 0 && query.trim() && (
            <div className="qs-empty">No documents found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

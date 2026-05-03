import { useState } from "react";
import { FilePlus, Search, X, ChevronRight, ChevronDown, File } from "lucide-react";
import { useVaultStore } from "@stores/vault";
import { useEditorStore } from "@stores/editor";
import { useDocument } from "@hooks/useDocument";
import { useSearch } from "@hooks/useSearch";
import type { SearchResult } from "@/types";

/**
 * Collapsible sidebar with a file tree, new-document button, and full-text search.
 */
export function Sidebar() {
  const { documents, activeDocId } = useVaultStore();
  const { openTab } = useEditorStore();
  const { createDocument, openDocument } = useDocument();
  const { search, results, isSearching, clearSearch } = useSearch();

  const [searchQuery, setSearchQuery] = useState("");
  const [treeExpanded, setTreeExpanded] = useState(true);

  const isSearchMode = searchQuery.trim().length > 0;

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      search(q);
    } else {
      clearSearch();
    }
  };

  const handleNewDocument = async () => {
    await createDocument("Untitled");
  };

  const handleOpenDocument = async (docId: string, title: string) => {
    await openDocument(docId, title);
  };

  const handleOpenSearchResult = async (result: SearchResult) => {
    await openDocument(result.docId, result.title);
    clearSearch();
    setSearchQuery("");
  };

  return (
    <aside className="sidebar" aria-label="Sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">My Vault</span>
        <button
          type="button"
          className="icon-btn"
          onClick={handleNewDocument}
          title="New Document"
          aria-label="New Document"
          id="btn-new-document"
        >
          <FilePlus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <Search size={14} className="search-icon" />
        <input
          id="sidebar-search-input"
          type="text"
          placeholder="Search notes…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
          aria-label="Search notes"
        />
        {searchQuery && (
          <button
            type="button"
            className="icon-btn-sm"
            onClick={() => handleSearch("")}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search results */}
      {isSearchMode && (
        <div className="search-results" role="list" aria-label="Search results">
          {isSearching && <div className="search-status">Searching…</div>}
          {!isSearching && results.length === 0 && (
            <div className="search-status">No results</div>
          )}
          {results.map((result) => (
            <button
              key={result.docId}
              type="button"
              className="search-result-item"
              onClick={() => handleOpenSearchResult(result)}
              role="listitem"
            >
              <span className="result-title">{result.title}</span>
              <span
                className="result-snippet"
                dangerouslySetInnerHTML={{ __html: result.snippet }}
              />
            </button>
          ))}
        </div>
      )}

      {/* File tree */}
      {!isSearchMode && (
        <nav className="file-tree" aria-label="Document tree">
          <button
            type="button"
            className="tree-section-header"
            onClick={() => setTreeExpanded((v) => !v)}
            aria-expanded={treeExpanded}
          >
            {treeExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>Documents</span>
            <span className="doc-count">{documents.length}</span>
          </button>

          {treeExpanded && (
            <ul className="tree-list" role="list">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <button
                    type="button"
                    className={`tree-item${activeDocId === doc.id ? " active" : ""}`}
                    onClick={() => handleOpenDocument(doc.id, doc.title)}
                    aria-current={activeDocId === doc.id ? "page" : undefined}
                    id={`doc-item-${doc.id}`}
                  >
                    <File size={14} />
                    <span className="tree-item-title">{doc.title}</span>
                  </button>
                </li>
              ))}
              {documents.length === 0 && (
                <li className="tree-empty">
                  No documents yet.{" "}
                  <button type="button" className="link-btn" onClick={handleNewDocument}>
                    Create one
                  </button>
                </li>
              )}
            </ul>
          )}
        </nav>
      )}

      {/* Expand all docs button in search mode */}
      {isSearchMode && (
        <button
          type="button"
          className="sidebar-footer-btn"
          onClick={() => openTab("", "")}
        >
          Browse all documents
        </button>
      )}
    </aside>
  );
}

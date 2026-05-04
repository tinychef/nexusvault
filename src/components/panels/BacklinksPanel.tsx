import { useState, useEffect } from "react";
import { getBacklinks } from "@lib/db/queries";
import { getDocumentById } from "@lib/db/queries";
import { useVaultStore } from "@stores/vault";
import { useDocument } from "@hooks/useDocument";
import { File, ArrowUpLeft } from "lucide-react";
import type { DocumentLink } from "@/types";

interface BacklinkEntry {
  link: DocumentLink;
  title: string;
}

/**
 * Panel that displays all documents linking TO the currently active document.
 * Each entry shows the source document title and the context snippet.
 */
export function BacklinksPanel() {
  const { activeDocId } = useVaultStore();
  const { openDocument } = useDocument();
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeDocId) {
      return;
    }

    let cancelled = false;

    async function loadBacklinks() {
      setIsLoading(true);
      try {
        const links = await getBacklinks(activeDocId!);

        // Resolve titles for each source document
        const entries: BacklinkEntry[] = [];
        for (const link of links) {
          const doc = await getDocumentById(link.sourceId);
          if (doc && !cancelled) {
            entries.push({ link, title: doc.title });
          }
        }

        if (!cancelled) {
          setBacklinks(entries);
        }
      } catch (err) {
        console.error("Failed to load backlinks:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBacklinks();
    return () => {
      cancelled = true;
    };
  }, [activeDocId]);

  const handleOpen = async (entry: BacklinkEntry) => {
    await openDocument(entry.link.sourceId, entry.title);
  };

  if (!activeDocId) {
    return (
      <div className="backlinks-empty">
        <ArrowUpLeft size={20} className="icon-muted" />
        <span>Select a document to see its backlinks.</span>
      </div>
    );
  }

  return (
    <div className="backlinks-panel" role="list" aria-label="Backlinks">
      {isLoading && <div className="backlinks-loading">Loading…</div>}

      {!isLoading && backlinks.length === 0 && (
        <div className="backlinks-empty">
          <ArrowUpLeft size={20} className="icon-muted" />
          <span>No other notes link to this one yet.</span>
        </div>
      )}

      {backlinks.map((entry) => (
        <button
          key={entry.link.sourceId}
          type="button"
          className="backlink-item"
          onClick={() => handleOpen(entry)}
          role="listitem"
        >
          <div className="backlink-header">
            <File size={14} />
            <span className="backlink-title">{entry.title}</span>
          </div>
          {entry.link.context && (
            <span
              className="backlink-context"
              dangerouslySetInnerHTML={{ __html: entry.link.context }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

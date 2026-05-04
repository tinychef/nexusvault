import { useState, useEffect } from "react";
import { getAllDocuments, getAllLinks } from "@lib/db/queries";
import type { VaultDocument, DocumentLink } from "@/types";

export interface GraphNode {
  id: string;
  name: string;
  val: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Hook that fetches all documents and links from SQLite
 * and transforms them into the graph format expected by react-force-graph.
 */
export function useGraphData(activeDocId: string | null) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadGraphData() {
      setIsLoading(true);
      try {
        const [docs, links]: [VaultDocument[], DocumentLink[]] = await Promise.all([
          getAllDocuments(),
          getAllLinks(),
        ]);

        if (cancelled) return;

        // Create a set of valid document IDs for filtering
        const docIds = new Set(docs.map((d) => d.id));

        // Build nodes — active doc gets bigger
        const nodes: GraphNode[] = docs.map((doc) => ({
          id: doc.id,
          name: doc.title,
          val: doc.id === activeDocId ? 3 : 1,
        }));

        // Build links — only include links where both endpoints exist
        const graphLinks: GraphLink[] = links
          .filter((l) => docIds.has(l.sourceId) && docIds.has(l.targetId))
          .map((l) => ({
            source: l.sourceId,
            target: l.targetId,
          }));

        setGraphData({ nodes, links: graphLinks });
      } catch (err) {
        console.error("Failed to load graph data:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadGraphData();
    return () => { cancelled = true; };
  }, [activeDocId]);

  return { graphData, isLoading };
}

import { useRef, useCallback, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useGraphData } from "@hooks/useGraphData";
import { useVaultStore } from "@stores/vault";
import { useDocument } from "@hooks/useDocument";
import type { GraphNode } from "@hooks/useGraphData";

/**
 * Interactive force-directed graph view of all documents and their links.
 * Renders in the right panel or as a full-screen overlay.
 */
export function GraphView() {
  const { activeDocId } = useVaultStore();
  const { openDocument } = useDocument();
  const { graphData, isLoading } = useGraphData(activeDocId);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  // Resize observer to fit graph to container
  useEffect(() => {
    if (!containerRef.current || !graphRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    graphRef.current.width(width);
    graphRef.current.height(height);
  }, [graphData]);

  const handleNodeClick = useCallback(
    (node: any) => {
      if (node?.id && node?.name) {
        openDocument(node.id as string, node.name as string);
      }
    },
    [openDocument]
  );

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = node as GraphNode & { x: number; y: number };
      const label = graphNode.name;
      const isActive = graphNode.id === activeDocId;
      const radius = isActive ? 6 : 4;

      // Node circle
      ctx.beginPath();
      ctx.arc(graphNode.x, graphNode.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = isActive ? "#7c5cfc" : "#5c5f66";
      ctx.fill();

      // Glow effect for active node
      if (isActive) {
        ctx.beginPath();
        ctx.arc(graphNode.x, graphNode.y, radius + 3, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "rgba(124, 92, 252, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      const fontSize = Math.max(10 / globalScale, 3);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isActive ? "#c1c2c5" : "#909296";
      ctx.fillText(label, graphNode.x, graphNode.y + radius + 2);
    },
    [activeDocId]
  );

  if (isLoading) {
    return (
      <div className="graph-loading">
        <span className="spin">⟳</span> Loading graph…
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="graph-empty">
        No documents to display yet.
      </div>
    );
  }

  return (
    <div className="graph-container" ref={containerRef}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          const r = (node as GraphNode).id === activeDocId ? 8 : 6;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={handleNodeClick}
        linkColor={() => "rgba(92, 95, 102, 0.3)"}
        linkWidth={1}
        backgroundColor="#1a1b1e"
        cooldownTicks={100}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "@stores/editor";
import { useVaultStore } from "@stores/vault";
import { useDocument } from "@hooks/useDocument";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Editor } from "@components/editor/Editor";
import { QuickSwitcher } from "@components/QuickSwitcher";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";
import { PanelLeft, Link2, Network, Bot } from "lucide-react";
import { useKeyboardShortcuts } from "@hooks/useKeyboardShortcuts";
import type { LoroDoc } from "loro-crdt";

/** Placeholder shown when no document is open */
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <h2>No document open</h2>
      <p>Select a document from the sidebar or create a new one.</p>
    </div>
  );
}

import { BacklinksPanel } from "@components/panels/BacklinksPanel";
import { GraphView } from "@components/graph/GraphView";
import { VaultChat } from "@components/ai/VaultChat";

/** Right panel: renders the active panel view (backlinks, graph, ai) */
function RightPanel() {
  const { rightPanelView } = useEditorStore();
  const labels: Record<string, string> = {
    backlinks: "Backlinks",
    graph: "Graph View",
    ai: "AI Assistant",
  };
  return (
    <aside className="right-panel" aria-label={labels[rightPanelView ?? ""] ?? "Panel"}>
      <div className="right-panel-header">
        <span>{rightPanelView ? labels[rightPanelView] : "Panel"}</span>
      </div>
      <div className="right-panel-body">
        {rightPanelView === "backlinks" && <BacklinksPanel />}
        {rightPanelView === "graph" && <GraphView />}
        {rightPanelView === "ai" && <VaultChat />}
      </div>
    </aside>
  );
}

/**
 * Root layout: sidebar | editor | optional right panel.
 * Manages panel open/close via the editor store.
 */
export function AppLayout() {
  const { sidebarOpen, rightPanelOpen, activeTabId, toggleSidebar, toggleRightPanel } =
    useEditorStore();
  const { documents } = useVaultStore();
  const { openDocument } = useDocument();

  const [loroDoc, setLoroDoc] = useState<LoroDoc | null>(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);

  const toggleQuickSwitcher = useCallback(() => {
    setQuickSwitcherOpen((prev) => !prev);
  }, []);

  useKeyboardShortcuts({ onQuickSwitcher: toggleQuickSwitcher });

  const activeDoc = documents.find((d) => d.id === activeTabId) ?? null;

  // Load the CRDT document when the active tab changes
  useEffect(() => {
    let mounted = true;

    async function loadActiveDoc() {
      if (!activeDoc) {
        setLoroDoc(null);
        return;
      }

      setIsDocLoading(true);
      try {
        const doc = await openDocument(activeDoc.id, activeDoc.title);
        if (mounted) {
          setLoroDoc(doc);
        }
      } catch (err) {
        console.error("Failed to load document:", err);
        if (mounted) {
          setLoroDoc(null);
        }
      } finally {
        if (mounted) {
          setIsDocLoading(false);
        }
      }
    }

    loadActiveDoc();

    return () => {
      mounted = false;
    };
  }, [activeDoc, openDocument]); // Re-run only when doc changes

  return (
    <div
      className={`app-layout${sidebarOpen ? "" : " sidebar-collapsed"}${rightPanelOpen ? " right-open" : ""}`}
    >
      {/* Sidebar toggle button (always visible) */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-label="Toggle sidebar"
        id="btn-toggle-sidebar"
      >
        <PanelLeft size={18} />
      </button>

      {/* Left sidebar */}
      {sidebarOpen && <Sidebar />}

      {/* Main editor area */}
      <main className="editor-area" role="main">
        <TabBar />
        {isDocLoading ? (
          <div className="empty-state">
            <div className="empty-state-icon spin">⟳</div>
            <p>Loading document...</p>
          </div>
        ) : activeDoc && loroDoc ? (
          <Editor docId={activeDoc.id} loroDoc={loroDoc} />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Right panel toggles: backlinks / graph / AI */}
      <div
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          display: "flex",
          gap: 4,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          className="right-panel-toggle"
          style={{ position: "static" }}
          onClick={() => toggleRightPanel("backlinks")}
          title="Toggle backlinks panel"
          aria-label="Toggle backlinks"
          id="btn-toggle-right-panel"
        >
          <Link2 size={18} />
        </button>
        <button
          type="button"
          className="right-panel-toggle"
          style={{ position: "static" }}
          onClick={() => toggleRightPanel("graph")}
          title="Toggle graph view"
          aria-label="Toggle graph view"
          id="btn-toggle-graph"
        >
          <Network size={18} />
        </button>
        <button
          type="button"
          className="right-panel-toggle"
          style={{ position: "static" }}
          onClick={() => toggleRightPanel("ai")}
          title="Toggle AI assistant"
          aria-label="Toggle AI assistant"
          id="btn-toggle-ai"
        >
          <Bot size={18} />
        </button>
      </div>

      {/* Right panel */}
      {rightPanelOpen && <RightPanel />}

      {/* Status bar */}
      <StatusBar />

      {/* Quick Switcher modal (Cmd+P) */}
      <QuickSwitcher
        isOpen={quickSwitcherOpen}
        onClose={() => setQuickSwitcherOpen(false)}
      />
    </div>
  );
}

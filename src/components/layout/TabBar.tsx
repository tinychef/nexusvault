import { X } from "lucide-react";
import { useEditorStore } from "@stores/editor";
import type { EditorTab } from "@/types";

interface TabProps {
  tab: EditorTab;
  isActive: boolean;
  onSelect: (docId: string) => void;
  onClose: (docId: string) => void;
}

function Tab({ tab, isActive, onSelect, onClose }: TabProps) {
  return (
    <div
      className={`editor-tab${isActive ? " active" : ""}`}
      role="tab"
      aria-selected={isActive}
      id={`tab-${tab.docId}`}
    >
      <button
        type="button"
        className="tab-title"
        onClick={() => onSelect(tab.docId)}
        title={tab.title}
      >
        {tab.isDirty ? `${tab.title} *` : tab.title}
      </button>
      <button
        type="button"
        className="tab-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose(tab.docId);
        }}
        aria-label={`Close ${tab.title}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}

/**
 * Tab bar showing all open documents with active highlight,
 * dirty indicator (*), and close button per tab.
 */
export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar" role="tablist" aria-label="Open documents">
      {tabs.map((tab) => (
        <Tab
          key={tab.docId}
          tab={tab}
          isActive={tab.docId === activeTabId}
          onSelect={setActiveTab}
          onClose={closeTab}
        />
      ))}
    </div>
  );
}

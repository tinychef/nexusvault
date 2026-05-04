import { useState, useEffect, useRef, useCallback } from "react";
import {
  FilePlus,
  Search,
  Network,
  Sun,
  Moon,
  Bot,
  Link2,
  PanelLeft,
  Zap,
} from "lucide-react";
import { useEditorStore } from "@stores/editor";
import { useDocument } from "@hooks/useDocument";
import { useSettingsStore, applyTheme } from "@stores/settings";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickSwitcher: () => void;
}

interface PaletteAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

/**
 * Cmd+K Command Palette — action launcher in the style of Notion/Linear.
 * Shows a curated list of app actions, keyboard-navigable.
 */
export function CommandPalette({
  isOpen,
  onClose,
  onOpenQuickSwitcher,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleSidebar, toggleRightPanel } = useEditorStore();
  const { createDocument } = useDocument();
  const { theme, setTheme } = useSettingsStore();

  const allActions: PaletteAction[] = [
    {
      id: "new-page",
      label: "New page",
      description: "Create a new document",
      icon: <FilePlus size={16} />,
      action: async () => {
        await createDocument("Untitled");
        onClose();
      },
      shortcut: "⌘N",
    },
    {
      id: "search",
      label: "Search notes",
      description: "Open document quick switcher",
      icon: <Search size={16} />,
      action: () => {
        onClose();
        onOpenQuickSwitcher();
      },
      shortcut: "⌘P",
    },
    {
      id: "toggle-sidebar",
      label: "Toggle sidebar",
      description: "Show or hide the left sidebar",
      icon: <PanelLeft size={16} />,
      action: () => {
        toggleSidebar();
        onClose();
      },
      shortcut: "⌘\\",
    },
    {
      id: "toggle-backlinks",
      label: "Open backlinks",
      description: "Show pages that link to this one",
      icon: <Link2 size={16} />,
      action: () => {
        toggleRightPanel("backlinks");
        onClose();
      },
    },
    {
      id: "toggle-graph",
      label: "Open graph view",
      description: "Visualize your knowledge graph",
      icon: <Network size={16} />,
      action: () => {
        toggleRightPanel("graph");
        onClose();
      },
    },
    {
      id: "toggle-ai",
      label: "Open AI assistant",
      description: "Chat with your vault",
      icon: <Bot size={16} />,
      action: () => {
        toggleRightPanel("ai");
        onClose();
      },
    },
    {
      id: "toggle-theme",
      label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      description: "Toggle between light and dark theme",
      icon: theme === "dark" ? <Sun size={16} /> : <Moon size={16} />,
      action: () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        applyTheme(next);
        onClose();
      },
    },
  ];

  const filtered = query.trim()
    ? allActions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : allActions;

  const maxIndex = Math.max(filtered.length - 1, 0);
  const activeIndex = Math.min(selectedIndex, maxIndex);

  const closeModal = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, maxIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[activeIndex]?.action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cp-overlay" onClick={closeModal} role="dialog" aria-label="Command Palette">
      <div
        className="cp-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cp-header">
          <Zap size={14} className="cp-header-icon" />
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            className="cp-input"
            placeholder="Search commands…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Command search"
          />
          <kbd className="cp-esc-hint">ESC</kbd>
        </div>

        {/* Actions list */}
        <div className="cp-list" role="listbox">
          {filtered.length === 0 && (
            <div className="cp-empty">No commands found</div>
          )}
          {filtered.map((action, i) => (
            <button
              key={action.id}
              type="button"
              className={`cp-action${i === activeIndex ? " selected" : ""}`}
              onClick={action.action}
              role="option"
              aria-selected={i === activeIndex}
            >
              <span className="cp-action-icon">{action.icon}</span>
              <span className="cp-action-content">
                <span className="cp-action-label">{action.label}</span>
                {action.description && (
                  <span className="cp-action-description">{action.description}</span>
                )}
              </span>
              {action.shortcut && (
                <kbd className="cp-action-shortcut">{action.shortcut}</kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

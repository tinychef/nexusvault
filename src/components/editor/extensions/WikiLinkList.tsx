import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FileText } from "lucide-react";

export interface WikiLinkItemProps {
  id: string;
  title: string;
}

interface WikiLinkListProps {
  items: WikiLinkItemProps[];
  command: (item: WikiLinkItemProps) => void;
}

export const WikiLinkList = forwardRef((props: WikiLinkListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items.length]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: any }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (!props.items.length) {
    return (
      <div className="z-50 min-w-[200px] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden p-3 text-center text-[var(--text-secondary)] text-sm">
        No documents found
      </div>
    );
  }

  return (
    <div className="z-50 min-w-[280px] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
      <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        Link to Document
      </div>
      <div className="p-1">
        {props.items.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors ${
              index === selectedIndex
                ? "bg-[var(--primary-dark)] text-[var(--primary-light)]"
                : "text-[var(--text-primary)] hover:bg-[var(--bg-modifier-hover)]"
            }`}
            onClick={() => selectItem(index)}
          >
            <div className={`p-1.5 rounded-md ${
              index === selectedIndex ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
            }`}>
              <FileText size={16} />
            </div>
            <div className="text-sm font-medium truncate">{item.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
});

WikiLinkList.displayName = "WikiLinkList";

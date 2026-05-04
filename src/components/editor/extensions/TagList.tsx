import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Hash } from "lucide-react";

interface TagItem {
  tag: string;
}

interface TagListProps {
  items: TagItem[];
  command: (item: TagItem) => void;
}

export const TagList = forwardRef<any, TagListProps>((props, ref) => {
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

  return (
    <div className="suggestion-menu">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            type="button"
            className={`suggestion-item${index === selectedIndex ? " is-selected" : ""}`}
            key={item.tag}
            onClick={() => selectItem(index)}
          >
            <Hash size={14} className="suggestion-icon" />
            <span>{item.tag}</span>
          </button>
        ))
      ) : (
        <div className="suggestion-item">
          <span className="suggestion-empty">No matching tags</span>
        </div>
      )}
    </div>
  );
});

TagList.displayName = "TagList";

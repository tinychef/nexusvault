import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { TagList } from "./TagList";
import { getAllUniqueTags } from "@lib/db/queries";

export const getTagSuggestionItems = async ({ query }: { query: string }) => {
  const allTags = await getAllUniqueTags();

  // Filter existing tags by query, and always allow creating a new tag
  const filtered = allTags
    .filter((tag: string) => tag.toLowerCase().startsWith(query.toLowerCase()))
    .map((tag: string) => ({ tag }));

  // If the query doesn't match any existing tag exactly, offer to create it
  if (query.trim() && !allTags.includes(query.trim())) {
    filtered.push({ tag: query.trim() });
  }

  return filtered.slice(0, 10);
};

export const renderTagSuggestion = () => {
  let component: ReactRenderer<any>;
  let popup: any;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(TagList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },

    onUpdate(props: any) {
      component.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup[0].hide();
        return true;
      }
      return component.ref?.onKeyDown(props);
    },

    onExit() {
      popup[0].destroy();
      component.destroy();
    },
  };
};

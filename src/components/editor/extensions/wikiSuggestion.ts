import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { WikiLinkList } from "./WikiLinkList";
import { getAllDocuments, searchDocumentsFTS } from "@lib/db/queries";

export const getWikiSuggestionItems = async ({ query }: { query: string }) => {
  if (query.trim() === "") {
    // If empty query, just return recent docs
    const allDocs = await getAllDocuments();
    return allDocs.slice(0, 10).map((doc) => ({
      id: doc.id,
      title: doc.title,
    }));
  }

  // Otherwise search
  const results = await searchDocumentsFTS(query);
  return results.slice(0, 10).map((res) => ({
    id: res.docId,
    title: res.title,
  }));
};

export const renderWikiSuggestion = () => {
  let component: ReactRenderer<any>;
  let popup: any;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(WikiLinkList, {
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

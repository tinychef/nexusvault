import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList } from "./CommandList";
import React from "react";
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Code,
  Minus,
  Table
} from "lucide-react";

export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: "Heading 1",
      description: "Big section heading.",
      icon: React.createElement(Heading1, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading.",
      icon: React.createElement(Heading2, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading.",
      icon: React.createElement(Heading3, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
      },
    },
    {
      title: "Bullet List",
      description: "Create a simple bulleted list.",
      icon: React.createElement(List, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering.",
      icon: React.createElement(ListOrdered, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Task List",
      description: "Track tasks with a to-do list.",
      icon: React.createElement(CheckSquare, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Code Block",
      description: "Capture a code snippet.",
      icon: React.createElement(Code, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Divider",
      description: "Visually divide blocks.",
      icon: React.createElement(Minus, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Table",
      description: "Insert a table.",
      icon: React.createElement(Table, { size: 18 }),
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      },
    },
  ].filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
};

export const renderSuggestion = () => {
  let component: ReactRenderer<any>;
  let popup: any;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandList, {
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

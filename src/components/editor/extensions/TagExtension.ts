import { Node, mergeAttributes } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionOptions } from "@tiptap/suggestion";

/**
 * TipTap extension for inline #tags with autocompletion.
 * Triggered by typing '#' followed by text.
 * Tags are rendered as inline styled spans.
 */
export const TagExtension = Node.create({
  name: "tag",

  group: "inline",

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      tag: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-tag"),
        renderHTML: (attributes: Record<string, string>) => {
          return {
            "data-tag": attributes.tag,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="tag"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ "data-type": "tag", class: "inline-tag" }, HTMLAttributes),
      `#${node.attrs.tag}`,
    ];
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },

  addOptions() {
    return {
      suggestion: {
        char: "#",
        command: ({ editor, range, props }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: this.name,
                attrs: { tag: props.tag },
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
      } as Omit<SuggestionOptions, "editor">,
    };
  },
});

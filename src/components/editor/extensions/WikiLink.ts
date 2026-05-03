import { Extension } from "@tiptap/core";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";

export const WikiLink = Extension.create({
  name: "wiki-link",

  addOptions() {
    return {
      suggestion: {
        char: "[[",
        command: ({ editor, range, props }: any) => {
          // Increase range.from by 2 because we match "[[" but we want to replace the whole thing including search term
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(" ");

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: "text",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: `nexus://doc/${props.id}`,
                      target: "_blank",
                    },
                  },
                ],
                text: props.title,
              },
              {
                type: "text",
                text: " ", // append space
              },
            ])
            .run();
        },
      } as Omit<SuggestionOptions, "editor">,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

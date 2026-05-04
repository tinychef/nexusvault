import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import { getAllDocuments, getTagsForDocument } from "@lib/db/queries";
import { loadDocument } from "@lib/loro/doc-manager";

/** Converts a TipTap JSON node tree to Markdown text. */
function nodeToMarkdown(node: Record<string, unknown>): string {
  const type = node.type as string;
  const children = Array.isArray(node.content)
    ? (node.content as Record<string, unknown>[]).map(nodeToMarkdown).join("")
    : "";

  switch (type) {
    case "doc": return children;
    case "paragraph": return children ? `${children}\n\n` : "\n";
    case "heading": {
      const level = (node.attrs as Record<string, unknown>)?.level as number ?? 1;
      return `${"#".repeat(level)} ${children}\n\n`;
    }
    case "text": {
      let text = (node.text as string) ?? "";
      const marks = node.marks as { type: string }[] ?? [];
      if (marks.some((m) => m.type === "bold")) text = `**${text}**`;
      if (marks.some((m) => m.type === "italic")) text = `*${text}*`;
      if (marks.some((m) => m.type === "code")) text = `\`${text}\``;
      if (marks.some((m) => m.type === "underline")) text = `__${text}__`;
      return text;
    }
    case "bulletList": return `${children}\n`;
    case "orderedList": return `${children}\n`;
    case "listItem": return `- ${children.trim()}\n`;
    case "blockquote": return children.split("\n").map((l) => `> ${l}`).join("\n") + "\n\n";
    case "codeBlock": {
      const lang = (node.attrs as Record<string, unknown>)?.language as string ?? "";
      return `\`\`\`${lang}\n${children}\`\`\`\n\n`;
    }
    case "hardBreak": return "\n";
    default: return children;
  }
}

/** Serializes a Loro CRDT snapshot to Markdown. */
async function docToMarkdown(docId: string, title: string, tags: string[]): Promise<string> {
  const loro = await loadDocument(docId);
  const raw = loro.getText("content").toString();

  let content: Record<string, unknown>;
  try {
    content = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return `# ${title}\n\n${raw}`;
  }

  const frontMatter = tags.length > 0
    ? `---\ntags: [${tags.join(", ")}]\n---\n\n`
    : "";

  const body = nodeToMarkdown(content);
  return `${frontMatter}# ${title}\n\n${body}`;
}

/**
 * Exports a single document to a .md file chosen by the user.
 */
export async function exportDocument(docId: string, title: string): Promise<void> {
  const filePath = await save({
    defaultPath: `${title}.md`,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });
  if (!filePath) return;

  const tags = await getTagsForDocument(docId);
  const md = await docToMarkdown(docId, title, tags);
  await writeTextFile(filePath, md);
}

/**
 * Exports all vault documents to a folder chosen by the user.
 * Each document becomes a separate .md file.
 */
export async function exportAllDocuments(): Promise<number> {
  const folder = await save({
    defaultPath: "nexusvault-export",
    filters: [{ name: "Folder", extensions: [""] }],
  });
  if (!folder) return 0;

  await mkdir(folder as string, { recursive: true });

  const docs = await getAllDocuments();
  let count = 0;

  for (const doc of docs) {
    const tags = await getTagsForDocument(doc.id);
    const md = await docToMarkdown(doc.id, doc.title, tags);
    const safe = doc.title.replace(/[<>:"/\\|?*]/g, "_");
    await writeTextFile(`${folder}/${safe}.md`, md);
    count++;
  }

  return count;
}

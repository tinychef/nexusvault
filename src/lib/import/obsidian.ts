import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { LoroDoc } from "loro-crdt";
import { insertDocument, insertLink, insertTag } from "@lib/db/queries";
import { saveDocument } from "@lib/loro/doc-manager";
import type { VaultDocument } from "@/types";

export interface ImportProgress {
  total: number;
  done: number;
  current: string;
}

/** Parses YAML front matter from a Markdown string. */
function parseFrontMatter(md: string): { tags: string[]; body: string } {
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) return { tags: [], body: md };

  const yaml = fmMatch[1];
  const body = fmMatch[2];

  const tagLine = yaml.match(/^tags:\s*\[([^\]]+)\]/m) ?? yaml.match(/^tags:\s*(.+)/m);
  const tags = tagLine
    ? tagLine[1]
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)
    : [];

  return { tags, body };
}

/** Extracts all [[wikilink]] targets from a markdown string. */
function extractWikiLinks(md: string): string[] {
  const matches = [...md.matchAll(/\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g)];
  return [...new Set(matches.map((m) => m[1].trim()))];
}

/** Converts basic Markdown to a TipTap JSON document. */
function mdToTipTapJSON(md: string): object {
  const lines = md.split("\n");
  const content: object[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: line.slice(4) }],
      });
    } else if (line.startsWith("## ")) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: line.slice(3) }],
      });
    } else if (line.startsWith("# ")) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: line.slice(2) }],
      });
    } else {
      const text = line
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/\[\[([^\]]+)\]\]/g, "$1");
      content.push({ type: "paragraph", content: text ? [{ type: "text", text }] : [] });
    }
  }

  return { type: "doc", content };
}

interface MdFile {
  name: string;
  filePath: string;
}

/** Recursively collects all .md files from a directory tree using Tauri plugin-fs. */
async function collectMdFiles(dir: string): Promise<MdFile[]> {
  const entries = await readDir(dir);
  const results: MdFile[] = [];

  for (const entry of entries) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      results.push({ name: entry.name, filePath: `${dir}/${entry.name}` });
    } else if (entry.isDirectory) {
      const nested = await collectMdFiles(`${dir}/${entry.name}`).catch(() => []);
      results.push(...nested);
    }
  }

  return results;
}

/**
 * Imports an Obsidian vault folder into NexusVault.
 * Opens a folder picker, reads all .md files, creates Loro docs, and
 * registers metadata, links, and tags in SQLite.
 */
export async function importObsidianVault(
  onProgress?: (p: ImportProgress) => void,
): Promise<number> {
  const folderPath = await open({
    directory: true,
    multiple: false,
    title: "Select Obsidian vault folder",
  });
  if (!folderPath) return 0;

  const mdFiles = await collectMdFiles(folderPath as string);
  const titleToId = new Map<string, string>();
  const total = mdFiles.length;
  let done = 0;

  for (const file of mdFiles) {
    const title = file.name.replace(/\.md$/, "");
    const id = crypto.randomUUID();
    titleToId.set(title, id);
    onProgress?.({ total, done, current: title });

    const raw = await readTextFile(file.filePath);
    const { tags, body } = parseFrontMatter(raw);
    const now = Date.now();

    const loroDoc = new LoroDoc();
    const tipTapJSON = mdToTipTapJSON(body);
    const text = loroDoc.getText("content");
    text.insert(0, JSON.stringify(tipTapJSON));
    await saveDocument(id, loroDoc);

    const meta: VaultDocument = {
      id,
      title,
      path: file.filePath,
      createdAt: now,
      updatedAt: now,
      wordCount: body.split(/\s+/).filter(Boolean).length,
      loroFile: `docs/${id}.loro`,
      isDeleted: false,
    };
    await insertDocument(meta);

    for (const tag of tags) {
      await insertTag(id, tag);
    }

    done++;
  }

  // Second pass: resolve wikilinks now that all titleToId entries exist
  for (const file of mdFiles) {
    const title = file.name.replace(/\.md$/, "");
    const sourceId = titleToId.get(title)!;
    const raw = await readTextFile(file.filePath);
    const { body } = parseFrontMatter(raw);
    const targets = extractWikiLinks(body);

    for (const target of targets) {
      const targetId = titleToId.get(target);
      if (targetId && targetId !== sourceId) {
        await insertLink(sourceId, targetId, "");
      }
    }
  }

  onProgress?.({ total, done: total, current: "Done" });
  return total;
}

import { LoroDoc } from "loro-crdt";
import { readFile, writeFile, exists } from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/api/path";

/** Base directory for .loro document files, relative to the vault root */
const DOCS_DIR = "docs";

/** Resolves the filesystem path for a document's .loro file */
function docPath(id: string): string {
  return `${DOCS_DIR}/${id}.loro`;
}

/**
 * Creates a new, empty LoroDoc with a "content" Text container.
 * The document is NOT persisted — call `saveDocument` afterwards.
 */
export function createNewDocument(_id: string): LoroDoc {
  const doc = new LoroDoc();
  // Initialize the primary text container
  doc.getText("content");
  return doc;
}

/**
 * Serializes a LoroDoc to a snapshot binary and writes it to the filesystem
 * via the Tauri `fs` plugin.
 */
export async function saveDocument(id: string, doc: LoroDoc): Promise<void> {
  const path = docPath(id);
  const snapshot = doc.export({ mode: "snapshot" });
  await writeFile(path, snapshot, { baseDir: BaseDirectory.AppLocalData });
}

/**
 * Reads a .loro file from the filesystem and loads it into a new LoroDoc.
 * Throws if the file does not exist.
 */
export async function loadDocument(id: string): Promise<LoroDoc> {
  const path = docPath(id);
  const fileExists = await documentExists(id);
  if (!fileExists) {
    throw new Error(`Document file not found: ${path}`);
  }
  const bytes = await readFile(path, { baseDir: BaseDirectory.AppLocalData });
  const doc = new LoroDoc();
  doc.import(bytes);
  return doc;
}

/**
 * Returns true if the .loro file exists on disk for the given document ID.
 */
export async function documentExists(id: string): Promise<boolean> {
  return exists(docPath(id), { baseDir: BaseDirectory.AppLocalData });
}

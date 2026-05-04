import { getDatabase } from "@lib/db/schema";
import type { VaultDocument, DocumentLink, SearchResult } from "@/types";

// ── Documents ────────────────────────────────────────────────────────────────

/**
 * Inserts a new document record into SQLite.
 * Uses positional parameters ($1…) to prevent SQL injection.
 */
export async function insertDocument(doc: VaultDocument): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `INSERT INTO documents (id, title, path, created_at, updated_at, word_count, loro_file, is_deleted)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      doc.id,
      doc.title,
      doc.path,
      doc.createdAt,
      doc.updatedAt,
      doc.wordCount,
      doc.loroFile,
      doc.isDeleted ? 1 : 0,
    ],
  );
}

/**
 * Retrieves a single document by ID. Returns null if not found.
 */
export async function getDocumentById(id: string): Promise<VaultDocument | null> {
  const db = await getDatabase();
  const rows = await db.select<RawDocument[]>(
    `SELECT * FROM documents WHERE id = $1 AND is_deleted = 0`,
    [id],
  );
  return rows.length > 0 ? mapRow(rows[0]) : null;
}

/**
 * Returns all non-deleted documents sorted by last modified date.
 */
export async function getAllDocuments(): Promise<VaultDocument[]> {
  const db = await getDatabase();
  const rows = await db.select<RawDocument[]>(
    `SELECT * FROM documents WHERE is_deleted = 0 ORDER BY updated_at DESC`,
  );
  return rows.map(mapRow);
}

/**
 * Merges partial updates into an existing document row.
 */
export async function updateDocumentMeta(
  id: string,
  updates: Partial<VaultDocument>,
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.execute(
    `UPDATE documents
     SET title      = COALESCE($1, title),
         path       = COALESCE($2, path),
         word_count = COALESCE($3, word_count),
         updated_at = $4
     WHERE id = $5`,
    [updates.title ?? null, updates.path ?? null, updates.wordCount ?? null, now, id],
  );
}

/**
 * Soft-deletes a document (sets is_deleted = 1).
 */
export async function softDeleteDocument(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(`UPDATE documents SET is_deleted = 1, updated_at = $1 WHERE id = $2`, [
    Date.now(),
    id,
  ]);
}

// ── Full-text search ─────────────────────────────────────────────────────────

/**
 * Full-text search via FTS5. Returns ranked results with snippets.
 */
export async function searchDocumentsFTS(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const db = await getDatabase();
  const rows = await db.select<FtsRow[]>(
    `SELECT d.id, d.title, snippet(documents_fts, 1, '<mark>', '</mark>', '…', 20) AS snippet,
            rank AS score
     FROM documents_fts
     JOIN documents d ON d.rowid = documents_fts.rowid
     WHERE documents_fts MATCH $1
       AND d.is_deleted = 0
     ORDER BY rank
     LIMIT 50`,
    [query],
  );
  return rows.map((r) => ({
    docId: r.id,
    title: r.title,
    snippet: r.snippet,
    score: r.score,
  }));
}

// ── Links ────────────────────────────────────────────────────────────────────

/**
 * Inserts a directional link between two documents.
 * Uses INSERT OR IGNORE to be idempotent.
 */
export async function insertLink(
  sourceId: string,
  targetId: string,
  context: string,
): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    `INSERT OR IGNORE INTO links (source_id, target_id, context) VALUES ($1, $2, $3)`,
    [sourceId, targetId, context],
  );
}

/**
 * Returns all documents that link TO the given target document (backlinks).
 */
export async function getBacklinks(targetId: string): Promise<DocumentLink[]> {
  const db = await getDatabase();
  const rows = await db.select<DocumentLink[]>(
    `SELECT source_id AS sourceId, target_id AS targetId, context
     FROM links WHERE target_id = $1`,
    [targetId],
  );
  return rows;
}

/**
 * Returns ALL links in the vault (for the graph view).
 */
export async function getAllLinks(): Promise<DocumentLink[]> {
  const db = await getDatabase();
  const rows = await db.select<DocumentLink[]>(
    `SELECT source_id AS sourceId, target_id AS targetId, context
     FROM links`,
  );
  return rows;
}

// ── Tags ─────────────────────────────────────────────────────────────────────

/**
 * Associates a tag with a document. Idempotent (INSERT OR IGNORE).
 */
export async function insertTag(docId: string, tag: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(`INSERT OR IGNORE INTO tags (doc_id, tag) VALUES ($1, $2)`, [
    docId,
    tag,
  ]);
}

/**
 * Returns all tags for a given document.
 */
export async function getTagsForDocument(docId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.select<{ tag: string }[]>(
    `SELECT tag FROM tags WHERE doc_id = $1 ORDER BY tag`,
    [docId],
  );
  return rows.map((r) => r.tag);
}

/**
 * Returns all documents that have a specific tag.
 */
export async function getDocumentsByTag(tag: string): Promise<VaultDocument[]> {
  const db = await getDatabase();
  const rows = await db.select<RawDocument[]>(
    `SELECT d.* FROM documents d
     JOIN tags t ON t.doc_id = d.id
     WHERE t.tag = $1 AND d.is_deleted = 0
     ORDER BY d.updated_at DESC`,
    [tag],
  );
  return rows.map(mapRow);
}

/**
 * Returns all unique tag names across all documents (for autocompletion).
 */
export async function getAllUniqueTags(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.select<{ tag: string }[]>(
    `SELECT DISTINCT tag FROM tags ORDER BY tag`,
  );
  return rows.map((r) => r.tag);
}

/**
 * Returns a plain-text snippet for a document from the FTS5 index.
 * Falls back to the document title when no FTS content has been indexed yet.
 */
export async function getDocumentSnippet(docId: string): Promise<string> {
  const db = await getDatabase();
  const rows = await db.select<{ snippet: string }[]>(
    `SELECT snippet(documents_fts, 1, '', '', '…', 30) AS snippet
     FROM documents_fts
     JOIN documents d ON d.rowid = documents_fts.rowid
     WHERE d.id = $1
     LIMIT 1`,
    [docId],
  );
  if (rows.length > 0 && rows[0].snippet.trim()) {
    return rows[0].snippet;
  }
  const titleRows = await db.select<{ title: string }[]>(
    `SELECT title FROM documents WHERE id = $1 LIMIT 1`,
    [docId],
  );
  return titleRows[0]?.title ?? "";
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Raw row shape returned by SQLite (snake_case, integers for booleans) */
interface RawDocument {
  id: string;
  title: string;
  path: string;
  created_at: number;
  updated_at: number;
  word_count: number;
  loro_file: string;
  is_deleted: number;
}

interface FtsRow {
  id: string;
  title: string;
  snippet: string;
  score: number;
}

/** Maps a raw SQLite row to the VaultDocument interface */
function mapRow(row: RawDocument): VaultDocument {
  return {
    id: row.id,
    title: row.title,
    path: row.path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    wordCount: row.word_count,
    loroFile: row.loro_file,
    isDeleted: row.is_deleted === 1,
  };
}

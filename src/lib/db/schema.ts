import Database from "@tauri-apps/plugin-sql";

/** Singleton SQLite connection */
let db: Database | null = null;

/**
 * Returns (and lazily initializes) the SQLite database connection.
 * Migrations are handled by the Rust backend via `tauri-plugin-sql`.
 */
export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:nexusvault.db");
  }
  return db;
}

/** SQL for the documents table (mirrors 001_init.sql) */
export const SCHEMA_DOCUMENTS = `
  CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    path        TEXT DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    word_count  INTEGER DEFAULT 0,
    loro_file   TEXT NOT NULL,
    is_deleted  INTEGER DEFAULT 0
  )
` as const;

/** SQL for the links table (mirrors 001_init.sql) */
export const SCHEMA_LINKS = `
  CREATE TABLE IF NOT EXISTS links (
    source_id   TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    context     TEXT DEFAULT '',
    PRIMARY KEY (source_id, target_id)
  )
` as const;

/** SQL for the FTS5 virtual table (mirrors 002_fts.sql) */
export const SCHEMA_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    title, content, tags,
    content='documents',
    content_rowid='rowid',
    tokenize='porter unicode61'
  )
` as const;

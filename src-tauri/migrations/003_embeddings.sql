-- Stores pre-computed embedding vectors for semantic search (Phase 4.2)
CREATE TABLE IF NOT EXISTS embeddings (
  doc_id      TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  vector_json TEXT NOT NULL,   -- JSON array of floats (512-dim)
  updated_at  INTEGER NOT NULL
);

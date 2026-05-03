CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    path        TEXT DEFAULT '',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    word_count  INTEGER DEFAULT 0,
    loro_file   TEXT NOT NULL,
    is_deleted  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS links (
    source_id   TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    context     TEXT DEFAULT '',
    PRIMARY KEY (source_id, target_id),
    FOREIGN KEY (source_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    doc_id      TEXT NOT NULL,
    tag         TEXT NOT NULL,
    PRIMARY KEY (doc_id, tag),
    FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(is_deleted);

CREATE TABLE IF NOT EXISTS sync_state (
    peer_id     TEXT NOT NULL,
    doc_id      TEXT NOT NULL,
    version     INTEGER NOT NULL,
    synced_at   INTEGER NOT NULL,
    PRIMARY KEY (peer_id, doc_id)
);

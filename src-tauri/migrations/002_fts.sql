CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    title,
    content,
    tags,
    content='documents',
    content_rowid='rowid',
    tokenize='porter unicode61'
);

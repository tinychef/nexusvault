import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";

type Bindings = {
  VAULT_STORAGE?: R2Bucket;  // optional until R2 is enabled in dashboard
  DB: D1Database;
  SYNC_STATE: KVNamespace;
  SYNC_SECRET_KEY?: string;
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/sync/*", async (c, next) => {
  const token = c.env.SYNC_SECRET_KEY || "development-token-123";
  const auth = bearerAuth({ token });
  return auth(c, next);
});

app.get("/health", (c) => {
  return c.json({
    service: "NexusVault Sync",
    version: "0.3.0",
    status: "operational",
    storage: c.env.VAULT_STORAGE ? "r2" : "d1-fallback",
    environment: c.env.ENVIRONMENT || "production",
  });
});

app.post("/sync/init", async (c) => {
  await c.env.DB.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      vault_id      TEXT,
      doc_id        TEXT,
      title         TEXT,
      last_modified INTEGER,
      word_count    INTEGER,
      PRIMARY KEY (vault_id, doc_id)
    );
    CREATE TABLE IF NOT EXISTS blobs (
      vault_id  TEXT,
      doc_id    TEXT,
      data      TEXT,
      PRIMARY KEY (vault_id, doc_id)
    );
  `);
  return c.json({ success: true });
});

app.get("/sync/vault/:vaultId/index", async (c) => {
  const vaultId = c.req.param("vaultId");
  const { results } = await c.env.DB.prepare(
    "SELECT doc_id, title, last_modified, word_count FROM metadata WHERE vault_id = ?",
  ).bind(vaultId).all();
  return c.json({ documents: results });
});

app.get("/sync/vault/:vaultId/doc/:docId", async (c) => {
  const vaultId = c.req.param("vaultId");
  const docId = c.req.param("docId");
  const objectPath = `${vaultId}/${docId}.loro`;

  // Use R2 when available, fall back to D1 blob storage
  if (c.env.VAULT_STORAGE) {
    const object = await c.env.VAULT_STORAGE.get(objectPath);
    if (!object) return c.json({ error: "Document not found" }, 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { headers });
  }

  const row = await c.env.DB.prepare(
    "SELECT data FROM blobs WHERE vault_id = ? AND doc_id = ?",
  ).bind(vaultId, docId).first<{ data: string }>();
  if (!row) return c.json({ error: "Document not found" }, 404);

  const bytes = Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0));
  return new Response(bytes, { headers: { "content-type": "application/octet-stream" } });
});

app.post("/sync/vault/:vaultId/doc/:docId", async (c) => {
  const vaultId = c.req.param("vaultId");
  const docId = c.req.param("docId");
  const body = await c.req.arrayBuffer();
  const title = c.req.header("X-Doc-Title") || "Untitled";
  const lastModified = parseInt(c.req.header("X-Doc-Modified") || String(Date.now()));
  const wordCount = parseInt(c.req.header("X-Doc-WordCount") || "0");

  if (c.env.VAULT_STORAGE) {
    await c.env.VAULT_STORAGE.put(`${vaultId}/${docId}.loro`, body, {
      customMetadata: { title, lastModified: String(lastModified) },
    });
  } else {
    // Store in D1 as base64 when R2 is unavailable
    const b64 = btoa(String.fromCharCode(...new Uint8Array(body)));
    await c.env.DB.prepare(
      `INSERT INTO blobs (vault_id, doc_id, data) VALUES (?, ?, ?)
       ON CONFLICT(vault_id, doc_id) DO UPDATE SET data = excluded.data`,
    ).bind(vaultId, docId, b64).run();
  }

  await c.env.DB.prepare(
    `INSERT INTO metadata (vault_id, doc_id, title, last_modified, word_count)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(vault_id, doc_id) DO UPDATE SET
       title = excluded.title,
       last_modified = excluded.last_modified,
       word_count = excluded.word_count`,
  ).bind(vaultId, docId, title, lastModified, wordCount).run();

  return c.json({ success: true, timestamp: Date.now() });
});

export default app;

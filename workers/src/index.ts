import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";

type Bindings = {
  VAULT_STORAGE: R2Bucket;
  DB: D1Database;
  SYNC_STATE: KVNamespace;
  SYNC_SECRET_KEY?: string;
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

function serviceStatus(environment?: string) {
  return {
    service: "NexusVault Sync",
    version: "0.4.0",
    status: "operational",
    storage: "r2",
    environment: environment || "production",
  };
}

app.use("*", async (c, next) => {
  try {
    await next();
  } catch {
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.use("/sync/*", async (c, next) => {
  const token = c.env.SYNC_SECRET_KEY;
  if (!token) {
    return c.json({ error: "Sync service misconfigured" }, 503);
  }
  const auth = bearerAuth({ token });
  return auth(c, next);
});

app.get("/", (c) => {
  return c.json(serviceStatus(c.env.ENVIRONMENT));
});

app.get("/health", (c) => {
  return c.json(serviceStatus(c.env.ENVIRONMENT));
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
  const object = await c.env.VAULT_STORAGE.get(`${vaultId}/${docId}.loro`);
  if (!object) return c.json({ error: "Document not found" }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
});

app.post("/sync/vault/:vaultId/doc/:docId", async (c) => {
  const vaultId = c.req.param("vaultId");
  const docId = c.req.param("docId");
  const body = await c.req.arrayBuffer();
  const title = c.req.header("X-Doc-Title") || "Untitled";
  const lastModified = parseInt(c.req.header("X-Doc-Modified") || String(Date.now()));
  const wordCount = parseInt(c.req.header("X-Doc-WordCount") || "0");

  await c.env.VAULT_STORAGE.put(`${vaultId}/${docId}.loro`, body, {
    customMetadata: { title, lastModified: String(lastModified) },
  });

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

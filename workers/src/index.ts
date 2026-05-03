import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";

type Bindings = {
  VAULT_STORAGE: R2Bucket;
  DB: D1Database;
  SYNC_SECRET_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Simple Bearer token authentication middleware for all /sync routes
app.use("/sync/*", async (c, next) => {
  const token = c.env.SYNC_SECRET_KEY || "development-token-123";
  const auth = bearerAuth({ token });
  return auth(c, next);
});

// Health check
app.get("/health", (c) => {
  return c.json({
    service: "NexusVault Sync",
    version: "0.2.0",
    status: "operational",
    phase: "Phase 2 (Hono + D1 + R2)",
  });
});

// Initialize DB tables if they don't exist
app.post("/sync/init", async (c) => {
  await c.env.DB.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      vault_id TEXT,
      doc_id TEXT,
      title TEXT,
      last_modified INTEGER,
      word_count INTEGER,
      PRIMARY KEY (vault_id, doc_id)
    );
  `);
  return c.json({ success: true });
});

// Get the index of a vault (all documents and their last modified time)
app.get("/sync/vault/:vaultId/index", async (c) => {
  const vaultId = c.req.param("vaultId");
  
  const { results } = await c.env.DB.prepare(
    "SELECT doc_id, title, last_modified, word_count FROM metadata WHERE vault_id = ?"
  ).bind(vaultId).all();

  return c.json({ documents: results });
});

// Pull document snapshot from R2
app.get("/sync/vault/:vaultId/doc/:docId", async (c) => {
  const vaultId = c.req.param("vaultId");
  const docId = c.req.param("docId");

  const objectPath = `${vaultId}/${docId}.loro`;
  const object = await c.env.VAULT_STORAGE.get(objectPath);

  if (!object) {
    return c.json({ error: "Document not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
});

// Push document snapshot to R2 and update D1 metadata
app.post("/sync/vault/:vaultId/doc/:docId", async (c) => {
  const vaultId = c.req.param("vaultId");
  const docId = c.req.param("docId");
  
  const body = await c.req.arrayBuffer();
  
  // Custom headers from client containing metadata
  const title = c.req.header("X-Doc-Title") || "Untitled";
  const lastModified = parseInt(c.req.header("X-Doc-Modified") || Date.now().toString());
  const wordCount = parseInt(c.req.header("X-Doc-WordCount") || "0");

  const objectPath = `${vaultId}/${docId}.loro`;
  
  // 1. Save binary Loro CRDT snapshot to R2
  await c.env.VAULT_STORAGE.put(objectPath, body, {
    customMetadata: { title, lastModified: lastModified.toString() }
  });

  // 2. Update D1 Index
  await c.env.DB.prepare(`
    INSERT INTO metadata (vault_id, doc_id, title, last_modified, word_count)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(vault_id, doc_id) DO UPDATE SET
      title = excluded.title,
      last_modified = excluded.last_modified,
      word_count = excluded.word_count
  `).bind(vaultId, docId, title, lastModified, wordCount).run();

  return c.json({ success: true, timestamp: Date.now() });
});

export default app;

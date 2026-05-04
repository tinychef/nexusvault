import { Hono } from "hono";

type Bindings = {
  VAULT_STORAGE: R2Bucket;
  DB: D1Database;
  SYNC_STATE: KVNamespace;
  MASTER_SECRET: string;
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

function serviceStatus(environment?: string) {
  return {
    service: "NexusVault Sync",
    version: "0.5.0",
    status: "operational",
    storage: "r2",
    environment: environment || "production",
  };
}

/**
 * Derives the expected auth token for a specific vault using HMAC-SHA256.
 * The client derives the same token from the user's encryption key.
 * Because each vaultId produces a different signature, tokens are vault-scoped.
 */
async function deriveVaultToken(masterSecret: string, vaultId: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    keyMaterial,
    new TextEncoder().encode(`nexusvault-sync-auth:${vaultId}`),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/** Constant-time string comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

app.use("*", async (c, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Unhandled error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/** Per-vault auth: each vault has its own derived token. */
app.use("/sync/vault/:vaultId/*", async (c, next) => {
  if (!c.env.MASTER_SECRET) {
    return c.json({ error: "Sync service misconfigured" }, 503);
  }
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const clientToken = authHeader.slice(7);
  const vaultId = c.req.param("vaultId");
  const expectedToken = await deriveVaultToken(c.env.MASTER_SECRET, vaultId);
  if (!safeEqual(clientToken, expectedToken)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

app.get("/", (c) => {
  return c.json(serviceStatus(c.env.ENVIRONMENT));
});

app.get("/health", (c) => {
  return c.json(serviceStatus(c.env.ENVIRONMENT));
});

app.get("/sync/vault/:vaultId/index", async (c) => {
  const vaultId = c.req.param("vaultId");
  const { results } = await c.env.DB.prepare(
    "SELECT doc_id, title, last_modified, word_count FROM metadata WHERE vault_id = ?",
  )
    .bind(vaultId)
    .all();
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
  const rawModified = c.req.header("X-Doc-Modified");
  const rawWordCount = c.req.header("X-Doc-WordCount");
  const lastModified =
    rawModified && /^\d+$/.test(rawModified) ? parseInt(rawModified, 10) : Date.now();
  const wordCount =
    rawWordCount && /^\d+$/.test(rawWordCount) ? parseInt(rawWordCount, 10) : 0;

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
  )
    .bind(vaultId, docId, title, lastModified, wordCount)
    .run();

  return c.json({ success: true, timestamp: Date.now() });
});

export default app;

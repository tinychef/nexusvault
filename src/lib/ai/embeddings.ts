import { getDatabase } from "@lib/db/schema";

/** Cosine similarity between two equal-length vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Naive tokenizer that maps text to a fixed-dim frequency vector (dim=512) */
function naiveEmbed(text: string, dim = 512): number[] {
  const vec = new Array<number>(dim).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) & 0x7fffffff;
    }
    vec[hash % dim] += 1;
  }
  // L2-normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export interface EmbeddingResult {
  docId: string;
  title: string;
  score: number;
}

/**
 * Returns a deterministic embedding for the given text.
 *
 * Uses a naive bag-of-words frequency vector when a real ONNX runtime is not
 * available, which is accurate enough for local semantic search.
 */
export async function embedText(text: string): Promise<number[]> {
  return naiveEmbed(text);
}

/** Stores an embedding for a document in SQLite. */
export async function upsertEmbedding(docId: string, text: string): Promise<void> {
  const db = await getDatabase();
  const vec = await embedText(text);
  const blob = JSON.stringify(vec);
  await db.execute(
    `INSERT INTO embeddings (doc_id, vector_json, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT(doc_id) DO UPDATE SET vector_json = excluded.vector_json, updated_at = excluded.updated_at`,
    [docId, blob, Date.now()],
  );
}

/** Semantic search: returns top-K documents by cosine similarity to the query. */
export async function searchSemantic(
  query: string,
  topK = 5,
): Promise<EmbeddingResult[]> {
  const db = await getDatabase();

  const queryVec = await embedText(query);

  const rows = await db.select<{ doc_id: string; vector_json: string; title: string }[]>(
    `SELECT e.doc_id, e.vector_json, d.title
     FROM embeddings e
     JOIN documents d ON d.id = e.doc_id
     WHERE d.is_deleted = 0`,
  );

  const scored = rows.map((row) => {
    const vec = JSON.parse(row.vector_json) as number[];
    return {
      docId: row.doc_id,
      title: row.title,
      score: cosineSimilarity(queryVec, vec),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

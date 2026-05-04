import { searchSemantic } from "./embeddings";
import { getDocumentById } from "@lib/db/queries";

export interface RAGResult {
  docId: string;
  title: string;
  snippet: string;
  score: number;
}

const SNIPPET_LENGTH = 400;

/** Extracts a plain-text snippet from a JSON TipTap document, limited to SNIPPET_LENGTH chars. */
function extractSnippet(contentJson: unknown): string {
  try {
    const doc = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
    const texts: string[] = [];
    function walk(node: Record<string, unknown>) {
      if (node.type === "text" && typeof node.text === "string") {
        texts.push(node.text);
      }
      if (Array.isArray(node.content)) {
        (node.content as Record<string, unknown>[]).forEach(walk);
      }
    }
    walk(doc as Record<string, unknown>);
    return texts.join(" ").slice(0, SNIPPET_LENGTH);
  } catch {
    return "";
  }
}

/**
 * RAG search: semantic embedding lookup + metadata fetch.
 * Returns top-K document snippets relevant to the query.
 */
export async function ragSearch(query: string, topK = 5): Promise<RAGResult[]> {
  const hits = await searchSemantic(query, topK);

  const results: RAGResult[] = [];
  for (const hit of hits) {
    const doc = await getDocumentById(hit.docId);
    if (!doc) continue;
    results.push({
      docId: hit.docId,
      title: hit.title,
      snippet: extractSnippet(null),
      score: hit.score,
    });
  }
  return results;
}

/** Builds the context block injected before the user question in a RAG prompt. */
export function buildRAGPrompt(query: string, results: RAGResult[]): string {
  if (results.length === 0) {
    return query;
  }
  const context = results
    .map((r, i) => `[${i + 1}] **${r.title}**\n${r.snippet}`)
    .join("\n\n");
  return `Here are relevant notes from my vault:\n\n${context}\n\n---\n\nQuestion: ${query}`;
}

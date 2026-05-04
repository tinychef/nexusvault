import { searchSemantic } from "./embeddings";
import { getDocumentSnippet } from "@lib/db/queries";

export interface RAGResult {
  docId: string;
  title: string;
  snippet: string;
  score: number;
}

/**
 * RAG search: semantic embedding lookup + FTS5 snippet fetch.
 * Returns top-K document snippets relevant to the query.
 */
export async function ragSearch(query: string, topK = 5): Promise<RAGResult[]> {
  const hits = await searchSemantic(query, topK);

  const results: RAGResult[] = [];
  for (const hit of hits) {
    const snippet = await getDocumentSnippet(hit.docId);
    results.push({
      docId: hit.docId,
      title: hit.title,
      snippet,
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

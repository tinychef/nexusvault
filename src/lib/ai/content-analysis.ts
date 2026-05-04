import type { AIProvider } from "@/types";

/** Calls the configured provider with a system+user prompt and returns text. */
async function callLLM(
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (provider.name === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": provider.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = (await res.json()) as { content: { text: string }[] };
    return data.content[0]?.text ?? "";
  }

  const isOllama = provider.name === "ollama";
  const baseUrl = isOllama ? (provider.baseUrl ?? "http://localhost:11434") : undefined;
  const apiUrl = isOllama
    ? `${baseUrl}/api/chat`
    : provider.name === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (!isOllama) headers["Authorization"] = `Bearer ${provider.apiKey}`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 256,
    }),
  });
  if (!res.ok) throw new Error(`LLM API error: ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message.content ?? "";
}

/**
 * Suggests up to 3 tags for the given document content.
 * Returns an array of tag strings (without leading #).
 */
export async function suggestTags(
  content: string,
  provider: AIProvider,
): Promise<string[]> {
  if (!content.trim()) return [];

  const text = await callLLM(
    provider,
    "You are a helpful note-tagging assistant. Respond ONLY with a comma-separated list of 3 concise tags (no leading #). No explanations.",
    `Suggest 3 tags for this note:\n\n${content.slice(0, 2000)}`,
  );

  return text
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 3);
}

/**
 * Generates a 1-2 sentence summary for the given document content.
 */
export async function quickSummary(
  content: string,
  provider: AIProvider,
): Promise<string> {
  if (!content.trim()) return "";

  return callLLM(
    provider,
    "You are a concise note summarizer. Respond with 1-2 sentences only.",
    `Summarize this note:\n\n${content.slice(0, 3000)}`,
  );
}

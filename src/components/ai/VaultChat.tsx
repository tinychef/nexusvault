import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot } from "lucide-react";
import { useSettingsStore } from "@stores/settings";
import { ragSearch, buildRAGPrompt } from "@lib/ai/rag";
import type { RAGResult } from "@lib/ai/rag";
import type { AIProvider } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: RAGResult[];
}

const PLACEHOLDER = "Ask anything about your vault…";

/**
 * Streaming chat UI backed by the configured BYOK AI provider and RAG search.
 */
export function VaultChat() {
  const { aiProvider } = useSettingsStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || isLoading || !aiProvider) return;

    setInput("");
    setIsLoading(true);

    const userMsg: ChatMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const sources = await ragSearch(query, 5);
      const ragPrompt = buildRAGPrompt(query, sources);
      const replyText = await callProvider(aiProvider, ragPrompt);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: replyText,
        sources: sources.filter((s) => s.score > 0.1),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, isLoading, aiProvider]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!aiProvider) {
    return (
      <div className="chat-empty">
        <Bot size={24} />
        <span>Configure an AI provider in Settings to enable chat.</span>
      </div>
    );
  }

  return (
    <div className="vault-chat">
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Bot size={24} />
            <span>Ask anything about your notes.</span>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <span className="chat-role">{msg.role === "user" ? "You" : "AI"}</span>
            <p className="chat-content">{msg.content}</p>
            {msg.sources && msg.sources.length > 0 && (
              <div className="chat-sources" aria-label="Sources">
                {msg.sources.map((s) => (
                  <span key={s.docId} className="chat-source-badge" title={s.title}>
                    {s.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant">
            <span className="chat-role">AI</span>
            <p className="chat-content" style={{ opacity: 0.5 }}>
              Thinking…
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={PLACEHOLDER}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Chat input"
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/** Calls the active provider and returns the full response text. */
async function callProvider(provider: AIProvider, prompt: string): Promise<string> {
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
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const data = (await res.json()) as { content: { text: string }[] };
    return data.content[0]?.text ?? "";
  }

  const isOllama = provider.name === "ollama";
  const apiUrl = isOllama
    ? `${provider.baseUrl ?? "http://localhost:11434"}/api/chat`
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
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`LLM API ${res.status}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message.content ?? "";
}

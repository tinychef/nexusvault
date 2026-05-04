import { useState } from "react";
import { useSettingsStore } from "@stores/settings";
import type { AIProvider } from "@/types";

const PROVIDERS: AIProvider["name"][] = ["claude", "openai", "groq", "ollama"];

const DEFAULT_MODELS: Record<AIProvider["name"], string> = {
  claude: "claude-sonnet-4-6",
  openai: "gpt-4o",
  groq: "llama-3.3-70b-versatile",
  ollama: "llama3.2",
};

const BASE_URLS: Partial<Record<AIProvider["name"], string>> = {
  ollama: "http://localhost:11434",
};

/**
 * Settings panel for BYOK (Bring Your Own Key) AI provider configuration.
 * API keys are stored in localStorage via the settings store (never sent server-side).
 */
export function AISettings() {
  const { aiProvider, setAIProvider } = useSettingsStore();

  const [provider, setProvider] = useState<AIProvider["name"]>(
    aiProvider?.name ?? "claude",
  );
  const [apiKey, setApiKey] = useState(aiProvider?.apiKey ?? "");
  const [model, setModel] = useState(aiProvider?.model ?? DEFAULT_MODELS["claude"]);
  const [baseUrl, setBaseUrl] = useState(aiProvider?.baseUrl ?? BASE_URLS["claude"] ?? "");
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "err">("idle");
  const [testMessage, setTestMessage] = useState("");

  const handleProviderChange = (p: AIProvider["name"]) => {
    setProvider(p);
    setModel(DEFAULT_MODELS[p]);
    setBaseUrl(BASE_URLS[p] ?? "");
    setTestStatus("idle");
  };

  const handleSave = () => {
    setAIProvider({ name: provider, apiKey, model, baseUrl: baseUrl || undefined });
    setTestStatus("idle");
  };

  const handleTest = async () => {
    setTestStatus("idle");
    setTestMessage("Testing…");

    try {
      const url = provider === "ollama"
        ? `${baseUrl || "http://localhost:11434"}/api/tags`
        : provider === "claude"
          ? "https://api.anthropic.com/v1/models"
          : provider === "groq"
            ? "https://api.groq.com/openai/v1/models"
            : "https://api.openai.com/v1/models";

      const headers: Record<string, string> = {};
      if (provider === "claude") {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
      } else if (provider !== "ollama") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        setTestStatus("ok");
        setTestMessage("Connection successful");
      } else {
        setTestStatus("err");
        setTestMessage(`HTTP ${res.status}`);
      }
    } catch (err) {
      setTestStatus("err");
      setTestMessage(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const needsApiKey = provider !== "ollama";

  return (
    <div className="settings-section">
      <div className="settings-field">
        <label className="settings-label" htmlFor="ai-provider">Provider</label>
        <select
          id="ai-provider"
          className="settings-select"
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as AIProvider["name"])}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {needsApiKey && (
        <div className="settings-field">
          <label className="settings-label" htmlFor="ai-key">API Key</label>
          <input
            id="ai-key"
            type="password"
            className="settings-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
          />
          <span className="settings-hint">Stored locally, never sent to NexusVault servers.</span>
        </div>
      )}

      <div className="settings-field">
        <label className="settings-label" htmlFor="ai-model">Model</label>
        <input
          id="ai-model"
          type="text"
          className="settings-input"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>

      {provider === "ollama" && (
        <div className="settings-field">
          <label className="settings-label" htmlFor="ai-base-url">Base URL</label>
          <input
            id="ai-base-url"
            type="text"
            className="settings-input"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>
      )}

      {testStatus !== "idle" && (
        <div className={`settings-status ${testStatus}`}>{testMessage}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="settings-btn" onClick={handleTest}>
          Test connection
        </button>
        <button type="button" className="settings-btn primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}

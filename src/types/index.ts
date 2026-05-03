/** Represents a document stored in the vault */
export interface VaultDocument {
  id: string;
  title: string;
  path: string;
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  loroFile: string;
  isDeleted: boolean;
}

/** A directional link between two documents (wiki-style backlinks) */
export interface DocumentLink {
  sourceId: string;
  targetId: string;
  context: string;
}

/** A tag associated with a document */
export interface DocumentTag {
  docId: string;
  tag: string;
}

/** Vault-level configuration persisted in .nexusvault/settings.json */
export interface VaultConfig {
  name: string;
  path: string;
  createdAt: number;
  syncEnabled: boolean;
  encryptionEnabled: boolean;
}

/** A single full-text search result with relevance score */
export interface SearchResult {
  docId: string;
  title: string;
  snippet: string;
  score: number;
}

/** AI provider configuration (Bring Your Own Key) */
export interface AIProvider {
  name: "claude" | "openai" | "groq" | "ollama";
  apiKey: string;
  model: string;
  baseUrl?: string;
}

/** Possible states for the real-time sync engine */
export type SyncStatus = "idle" | "syncing" | "error" | "offline";

/** Real-time sync state */
export interface SyncState {
  status: SyncStatus;
  lastSyncAt: number | null;
  pendingChanges: number;
}

/** Tab representing an open document in the editor */
export interface EditorTab {
  docId: string;
  title: string;
  isDirty: boolean;
}

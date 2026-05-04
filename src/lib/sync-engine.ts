import { encryptData, decryptData } from "./crypto";

const WORKER_URL = import.meta.env.VITE_SYNC_WORKER_URL || "http://localhost:8787";

function getSyncToken(): string {
  const token = import.meta.env.VITE_SYNC_TOKEN;
  if (!token) {
    throw new Error("VITE_SYNC_TOKEN is not configured");
  }
  return token;
}

export interface RemoteDocMetadata {
  doc_id: string;
  title: string;
  last_modified: number;
  word_count: number;
}

/**
 * Sync Engine for communicating with the Cloudflare Worker backend.
 * All data is encrypted client-side using the provided vault key.
 */
export const syncEngine = {
  /**
   * Fetches the index of documents in the remote vault.
   */
  async getVaultIndex(vaultId: string): Promise<RemoteDocMetadata[]> {
    const response = await fetch(`${WORKER_URL}/sync/vault/${vaultId}/index`, {
      headers: {
        Authorization: `Bearer ${getSyncToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vault index: ${response.statusText}`);
    }

    const data = await response.json();
    return data.documents;
  },

  /**
   * Pushes a document snapshot to the remote server after encrypting it.
   */
  async pushDocument(
    vaultId: string,
    docId: string,
    binary: Uint8Array,
    metadata: { title: string; lastModified: number; wordCount: number },
    key: Uint8Array,
  ): Promise<void> {
    // 1. Encrypt the Loro CRDT binary
    const encrypted = encryptData(binary, key);

    // 2. Upload to Worker
    const response = await fetch(`${WORKER_URL}/sync/vault/${vaultId}/doc/${docId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getSyncToken()}`,
        "Content-Type": "application/octet-stream",
        "X-Doc-Title": metadata.title,
        "X-Doc-Modified": metadata.lastModified.toString(),
        "X-Doc-WordCount": metadata.wordCount.toString(),
      },
      body: encrypted.buffer.slice(
        encrypted.byteOffset,
        encrypted.byteOffset + encrypted.byteLength,
      ) as ArrayBuffer,
    });

    if (!response.ok) {
      throw new Error(`Failed to push document: ${response.statusText}`);
    }
  },

  /**
   * Pulls a document snapshot from the remote server and decrypts it.
   */
  async pullDocument(
    vaultId: string,
    docId: string,
    key: Uint8Array,
  ): Promise<Uint8Array> {
    const response = await fetch(`${WORKER_URL}/sync/vault/${vaultId}/doc/${docId}`, {
      headers: {
        Authorization: `Bearer ${getSyncToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Document not found on remote");
      }
      throw new Error(`Failed to pull document: ${response.statusText}`);
    }

    const encryptedData = new Uint8Array(await response.arrayBuffer());

    // 3. Decrypt the binary
    return decryptData(encryptedData, key);
  },
};

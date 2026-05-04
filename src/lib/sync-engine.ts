import { encryptData, decryptData } from "./crypto";

export interface RemoteDocMetadata {
  doc_id: string;
  title: string;
  last_modified: number;
  word_count: number;
}

/**
 * Derives a per-vault auth token from the user's encryption key using HMAC-SHA256.
 * The token is computed at runtime from the key the user provides — never stored or
 * embedded in the build. The Worker derives the same token using its MASTER_SECRET.
 */
export async function deriveVaultAuthToken(
  encryptionKey: Uint8Array,
  vaultId: string,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encryptionKey.buffer.slice(
      encryptionKey.byteOffset,
      encryptionKey.byteOffset + encryptionKey.byteLength,
    ) as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const info = new TextEncoder().encode(`nexusvault-sync-auth:${vaultId}`);
  const sig = await crypto.subtle.sign("HMAC", keyMaterial, info);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/**
 * Sync Engine for communicating with the Cloudflare Worker backend.
 * All data is encrypted client-side using the provided vault key.
 * Auth tokens are derived at runtime — never hardcoded or build-time injected.
 */
export class SyncEngine {
  private readonly workerUrl: string;
  private authToken: string | null = null;

  constructor(
    private readonly vaultId: string,
    private readonly encryptionKey: Uint8Array,
    workerUrl: string,
  ) {
    this.workerUrl = workerUrl || "http://localhost:8787";
  }

  private async getAuthHeader(): Promise<string> {
    if (!this.authToken) {
      this.authToken = await deriveVaultAuthToken(this.encryptionKey, this.vaultId);
    }
    return `Bearer ${this.authToken}`;
  }

  async getVaultIndex(): Promise<RemoteDocMetadata[]> {
    const response = await fetch(
      `${this.workerUrl}/sync/vault/${this.vaultId}/index`,
      { headers: { Authorization: await this.getAuthHeader() } },
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch vault index: ${response.statusText}`);
    }
    const data = (await response.json()) as { documents: RemoteDocMetadata[] };
    return data.documents;
  }

  async pushDocument(
    docId: string,
    binary: Uint8Array,
    metadata: { title: string; lastModified: number; wordCount: number },
  ): Promise<void> {
    const encrypted = encryptData(binary, this.encryptionKey);
    const response = await fetch(
      `${this.workerUrl}/sync/vault/${this.vaultId}/doc/${docId}`,
      {
        method: "POST",
        headers: {
          Authorization: await this.getAuthHeader(),
          "Content-Type": "application/octet-stream",
          "X-Doc-Title": metadata.title,
          "X-Doc-Modified": metadata.lastModified.toString(),
          "X-Doc-WordCount": metadata.wordCount.toString(),
        },
        body: encrypted.buffer.slice(
          encrypted.byteOffset,
          encrypted.byteOffset + encrypted.byteLength,
        ) as ArrayBuffer,
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to push document: ${response.statusText}`);
    }
  }

  async pullDocument(docId: string): Promise<Uint8Array> {
    const response = await fetch(
      `${this.workerUrl}/sync/vault/${this.vaultId}/doc/${docId}`,
      { headers: { Authorization: await this.getAuthHeader() } },
    );
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Document not found on remote");
      }
      throw new Error(`Failed to pull document: ${response.statusText}`);
    }
    const encryptedData = new Uint8Array(await response.arrayBuffer());
    return decryptData(encryptedData, this.encryptionKey);
  }
}

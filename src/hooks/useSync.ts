import { useCallback } from "react";
import { useSyncStore } from "@/stores/sync";
import { useSettingsStore } from "@/stores/settings";
import { SyncEngine } from "@/lib/sync-engine";
import { getAllDocuments, insertDocument, updateDocumentMeta } from "@/lib/db/queries";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/api/path";
import { LoroDoc } from "loro-crdt";

export function useSync() {
  const { setStatus, setLastSynced, setError, setPendingChanges } = useSyncStore();
  const { syncUrl } = useSettingsStore();

  const syncAll = useCallback(
    async (vaultId: string, encryptionKey: Uint8Array) => {
      setStatus("syncing");
      setError(null);

      const engine = new SyncEngine(vaultId, encryptionKey, syncUrl);

      try {
        // 1. Get local and remote indices
        const localDocs = await getAllDocuments();
        const remoteDocs = await engine.getVaultIndex();

        const remoteMap = new Map(remoteDocs.map((d) => [d.doc_id, d]));
        const localMap = new Map(localDocs.map((d) => [d.id, d]));

        // 2. Process Remote Documents (Pull changes)
        for (const remote of remoteDocs) {
          const local = localMap.get(remote.doc_id);

          if (!local || remote.last_modified > local.updatedAt) {
            const decryptedBinary = await engine.pullDocument(remote.doc_id);
            const path = `docs/${remote.doc_id}.loro`;

            if (local) {
              const localBytes = await readFile(path, {
                baseDir: BaseDirectory.AppLocalData,
              });
              const doc = new LoroDoc();
              doc.import(localBytes);
              doc.import(decryptedBinary);
              const merged = doc.export({ mode: "snapshot" });
              await writeFile(path, merged, { baseDir: BaseDirectory.AppLocalData });
              await updateDocumentMeta(remote.doc_id, {
                title: remote.title,
                wordCount: remote.word_count,
                updatedAt: remote.last_modified,
              });
            } else {
              await writeFile(path, decryptedBinary, {
                baseDir: BaseDirectory.AppLocalData,
              });
              await insertDocument({
                id: remote.doc_id,
                title: remote.title,
                path: remote.doc_id,
                createdAt: remote.last_modified,
                updatedAt: remote.last_modified,
                wordCount: remote.word_count,
                loroFile: path,
                isDeleted: false,
              });
            }
          }
        }

        // 3. Process Local Documents (Push changes)
        for (const local of localDocs) {
          const remote = remoteMap.get(local.id);

          if (!remote || local.updatedAt > remote.last_modified) {
            const localBytes = await readFile(`docs/${local.id}.loro`, {
              baseDir: BaseDirectory.AppLocalData,
            });
            await engine.pushDocument(local.id, localBytes, {
              title: local.title,
              lastModified: local.updatedAt,
              wordCount: local.wordCount,
            });
          }
        }

        setLastSynced(Date.now());
        setPendingChanges(0);
        setStatus("idle");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [setStatus, setLastSynced, setError, setPendingChanges, syncUrl],
  );

  return { syncAll };
}

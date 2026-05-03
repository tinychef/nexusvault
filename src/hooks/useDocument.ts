import { useCallback, useRef } from "react";
import { useVaultStore } from "@stores/vault";
import { useEditorStore } from "@stores/editor";
import { createNewDocument, saveDocument, loadDocument } from "@lib/loro/doc-manager";
import { insertDocument, softDeleteDocument, updateDocumentMeta } from "@lib/db/queries";
import type { VaultDocument } from "@/types";
import type { LoroDoc } from "loro-crdt";

/**
 * Custom hook that combines Loro CRDT file management with SQLite metadata
 * and Zustand store updates for a complete document lifecycle.
 */
export function useDocument() {
  const { addDocument, removeDocument, updateDocument } = useVaultStore();
  const { openTab, closeTab, markTabDirty, setIsSaving, setLastSavedAt } =
    useEditorStore();

  // In-memory cache of loaded LoroDoc instances
  const docsCache = useRef<Map<string, LoroDoc>>(new Map());

  /**
   * Creates a new document: generates a LoroDoc, persists to disk,
   * inserts metadata in SQLite, and opens an editor tab.
   */
  const createDocument = useCallback(
    async (title: string): Promise<VaultDocument> => {
      const id = crypto.randomUUID();
      const now = Date.now();
      const loroFile = `docs/${id}.loro`;

      // 1. Create and save CRDT document
      const doc = createNewDocument(id);
      await saveDocument(id, doc);
      docsCache.current.set(id, doc);

      // 2. Build metadata record
      const meta: VaultDocument = {
        id,
        title,
        path: "",
        createdAt: now,
        updatedAt: now,
        wordCount: 0,
        loroFile,
        isDeleted: false,
      };

      // 3. Persist metadata to SQLite
      await insertDocument(meta);

      // 4. Update global store + open tab
      addDocument(meta);
      openTab(id, title);

      return meta;
    },
    [addDocument, openTab],
  );

  /**
   * Opens an existing document: loads its LoroDoc from disk (with cache),
   * and activates its editor tab.
   */
  const openDocument = useCallback(
    async (id: string, title: string): Promise<LoroDoc> => {
      let doc = docsCache.current.get(id);
      if (!doc) {
        doc = await loadDocument(id);
        docsCache.current.set(id, doc);
      }
      openTab(id, title);
      return doc;
    },
    [openTab],
  );

  /**
   * Saves a LoroDoc snapshot to disk and updates the document's metadata
   * (word count, updatedAt) in SQLite and the Zustand store.
   */
  const saveDocumentData = useCallback(
    async (id: string, doc: LoroDoc, wordCount: number): Promise<void> => {
      setIsSaving(true);
      try {
        const now = Date.now();
        await saveDocument(id, doc);
        await updateDocumentMeta(id, { wordCount, updatedAt: now });
        updateDocument(id, { wordCount, updatedAt: now });
        markTabDirty(id, false);
        setLastSavedAt(now);
      } finally {
        setIsSaving(false);
      }
    },
    [setIsSaving, updateDocument, markTabDirty, setLastSavedAt],
  );

  /**
   * Soft-deletes a document: marks it deleted in SQLite, removes it from
   * the store, and closes its editor tab.
   */
  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      await softDeleteDocument(id);
      docsCache.current.delete(id);
      removeDocument(id);
      closeTab(id);
    },
    [removeDocument, closeTab],
  );

  return { createDocument, openDocument, saveDocument: saveDocumentData, deleteDocument };
}

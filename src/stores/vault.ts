import { create } from "zustand";
import type { VaultDocument, VaultConfig } from "@/types";

interface VaultState {
  // ── State ─────────────────────────────────────────────────────────────────
  documents: VaultDocument[];
  activeDocId: string | null;
  vaultConfig: VaultConfig | null;
  isLoading: boolean;
  error: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Replace the full document list (used on initial vault load) */
  setDocuments: (docs: VaultDocument[]) => void;
  /** Set the currently focused document ID */
  setActiveDocument: (id: string | null) => void;
  /** Append a single new document to the list */
  addDocument: (doc: VaultDocument) => void;
  /** Remove a document from the list by ID */
  removeDocument: (id: string) => void;
  /** Merge partial updates into an existing document */
  updateDocument: (id: string, updates: Partial<VaultDocument>) => void;
  /** Store vault-level configuration */
  setVaultConfig: (config: VaultConfig) => void;
  /** Toggle global loading state */
  setLoading: (loading: boolean) => void;
  /** Store an error message (null to clear) */
  setError: (error: string | null) => void;
}

/**
 * Global Zustand store for vault state.
 * Owns the document list, active document, and vault configuration.
 */
export const useVaultStore = create<VaultState>((set) => ({
  documents: [],
  activeDocId: null,
  vaultConfig: null,
  isLoading: false,
  error: null,

  setDocuments: (documents) => set({ documents }),

  setActiveDocument: (activeDocId) => set({ activeDocId }),

  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      activeDocId: state.activeDocId === id ? null : state.activeDocId,
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),

  setVaultConfig: (vaultConfig) => set({ vaultConfig }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));

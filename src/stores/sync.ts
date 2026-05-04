import { create } from "zustand";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSynced: number | null;
  error: string | null;
  pendingChanges: number;
  
  setStatus: (status: SyncStatus) => void;
  setLastSynced: (timestamp: number) => void;
  setError: (error: string | null) => void;
  setPendingChanges: (count: number) => void;
  incrementPendingChanges: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",
  lastSynced: null,
  error: null,
  pendingChanges: 0,
  
  setStatus: (status) => set({ status }),
  setLastSynced: (lastSynced) => set({ lastSynced }),
  setError: (error) => set({ error }),
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  incrementPendingChanges: () => set((state) => ({ pendingChanges: state.pendingChanges + 1 })),
}));

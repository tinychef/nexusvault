import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";
import type { AIProvider } from "@/types";

type Theme = "dark" | "light" | "system";

/** Settings persisted to localStorage (NO secrets — apiKey is stored in OS keychain). */
interface PersistedSettings {
  theme: Theme;
  aiProviderName: AIProvider["name"] | null;
  aiProviderModel: string | null;
  aiProviderBaseUrl: string | null;
  syncUrl: string;
  syncEnabled: boolean;
}

interface SettingsState extends PersistedSettings {
  /** Full provider object (reconstructed at load; apiKey comes from keychain). */
  aiProvider: AIProvider | null;

  setTheme: (theme: Theme) => void;
  /** Persists provider name/model to localStorage and apiKey to OS keychain. */
  setAIProvider: (provider: AIProvider | null) => Promise<void>;
  setSyncUrl: (url: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  /** Loads the apiKey from the OS keychain and reconstructs the full provider. */
  loadAIProviderKey: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      aiProviderName: null,
      aiProviderModel: null,
      aiProviderBaseUrl: null,
      syncUrl: "",
      syncEnabled: false,
      aiProvider: null,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setAIProvider: async (provider) => {
        if (!provider) {
          const prev = get().aiProviderName;
          if (prev) {
            await invoke("delete_api_key", { provider: prev }).catch(() => undefined);
          }
          set({
            aiProvider: null,
            aiProviderName: null,
            aiProviderModel: null,
            aiProviderBaseUrl: null,
          });
          return;
        }
        await invoke("save_api_key", { provider: provider.name, key: provider.apiKey });
        set({
          aiProvider: provider,
          aiProviderName: provider.name,
          aiProviderModel: provider.model,
          aiProviderBaseUrl: provider.baseUrl ?? null,
        });
      },

      setSyncUrl: (syncUrl) => set({ syncUrl }),
      setSyncEnabled: (syncEnabled) => set({ syncEnabled }),

      loadAIProviderKey: async () => {
        const { aiProviderName, aiProviderModel } = get();
        if (!aiProviderName || !aiProviderModel) return;
        const apiKey = await invoke<string | null>("get_api_key", {
          provider: aiProviderName,
        });
        if (!apiKey) return;
        set({
          aiProvider: {
            name: aiProviderName,
            apiKey,
            model: aiProviderModel,
            baseUrl: get().aiProviderBaseUrl ?? undefined,
          },
        });
      },
    }),
    {
      name: "nexusvault-settings",
      partialize: (state) => ({
        theme: state.theme,
        aiProviderName: state.aiProviderName,
        aiProviderModel: state.aiProviderModel,
        aiProviderBaseUrl: state.aiProviderBaseUrl,
        syncUrl: state.syncUrl,
        syncEnabled: state.syncEnabled,
      }),
    },
  ),
);

/** Applies the theme data attribute to <html> so CSS vars respond. */
export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

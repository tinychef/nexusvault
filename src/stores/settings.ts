import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIProvider } from "@/types";

type Theme = "dark" | "light" | "system";

interface SettingsState {
  theme: Theme;
  aiProvider: AIProvider | null;
  syncUrl: string;
  syncEnabled: boolean;

  setTheme: (theme: Theme) => void;
  setAIProvider: (provider: AIProvider | null) => void;
  setSyncUrl: (url: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      aiProvider: null,
      syncUrl: "",
      syncEnabled: false,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setAIProvider: (aiProvider) => set({ aiProvider }),
      setSyncUrl: (syncUrl) => set({ syncUrl }),
      setSyncEnabled: (syncEnabled) => set({ syncEnabled }),
    }),
    { name: "nexusvault-settings" },
  ),
);

/** Applies the theme data attribute to <html> so CSS vars respond. */
export function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

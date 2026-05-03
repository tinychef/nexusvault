import { useEffect, useState } from "react";
import { useVaultStore } from "@stores/vault";
import { getAllDocuments } from "@lib/db/queries";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/api/path";

export function useVaultInit() {
  const { setDocuments, setLoading, setError } = useVaultStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initVault() {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Ensure `docs/` directory exists for Loro files
        const docsDirExists = await exists("docs", { baseDir: BaseDirectory.AppLocalData });
        if (!docsDirExists) {
          await mkdir("docs", { baseDir: BaseDirectory.AppLocalData, recursive: true });
        }

        // 2. Load documents from SQLite
        const docs = await getAllDocuments();
        
        if (mounted) {
          setDocuments(docs);
          setIsInitialized(true);
        }
      } catch (err) {
        if (mounted) {
          console.error("Vault initialization failed:", err);
          setError(err instanceof Error ? err.message : "Failed to initialize vault");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initVault();

    return () => {
      mounted = false;
    };
  }, [setDocuments, setLoading, setError]);

  return { isInitialized };
}

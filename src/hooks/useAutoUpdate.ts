import { useEffect, useState } from "react";

type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; version: string }
  | { status: "downloading"; progress: number }
  | { status: "ready" }
  | { status: "error"; message: string };

/**
 * Checks for app updates on mount and exposes install / dismiss controls.
 * Uses the Tauri updater plugin which reads the update endpoint from tauri.conf.json.
 *
 * Note: requires @tauri-apps/plugin-updater and @tauri-apps/plugin-process.
 * Install with: npm install @tauri-apps/plugin-updater @tauri-apps/plugin-process
 */
export function useAutoUpdate() {
  const [state, setState] = useState<UpdateState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      setState({ status: "checking" });
      try {
        // Dynamic import so the app still loads even if the plugin is absent
        const { check } = await import("@tauri-apps/plugin-updater").catch(() => ({
          check: async () => null,
        }));
        const update = await check();
        if (cancelled) return;

        if (!update?.available) {
          setState({ status: "idle" });
          return;
        }

        setState({ status: "available", version: update.version });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Update check failed",
          });
        }
      }
    }

    checkForUpdate();
    return () => {
      cancelled = true;
    };
  }, []);

  const installUpdate = async () => {
    if (state.status !== "available") return;

    setState({ status: "downloading", progress: 0 });
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update?.available) return;

      await update.downloadAndInstall((event: Record<string, unknown>) => {
        if (event.event === "Progress" && event.data) {
          const d = event.data as { chunkLength: number; contentLength: number };
          if (d.contentLength > 0) {
            setState({
              status: "downloading",
              progress: Math.round((d.chunkLength / d.contentLength) * 100),
            });
          }
        }
      });

      setState({ status: "ready" });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Install failed",
      });
    }
  };

  const applyUpdate = async () => {
    if (state.status !== "ready") return;
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  };

  const dismiss = () => setState({ status: "idle" });

  return { state, installUpdate, applyUpdate, dismiss };
}

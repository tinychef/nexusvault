import { useState } from "react";
import { useSettingsStore } from "@stores/settings";
import { useSyncStore } from "@stores/sync";

/**
 * Settings panel for configuring the Cloudflare sync backend.
 */
export function SyncSettings() {
  const { syncUrl, syncEnabled, setSyncUrl, setSyncEnabled } = useSettingsStore();
  const { status, lastSynced } = useSyncStore();

  const [url, setUrl] = useState(syncUrl);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSyncUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return "Never";
    return new Date(ts).toLocaleString();
  };

  const statusLabel: Record<string, string> = {
    idle: "Connected",
    syncing: "Syncing…",
    error: "Error",
    offline: "Offline",
  };

  return (
    <div className="settings-section">
      <div className="settings-row">
        <span className="settings-label">Enable sync</span>
        <button
          type="button"
          className={`settings-toggle${syncEnabled ? " on" : ""}`}
          onClick={() => setSyncEnabled(!syncEnabled)}
          aria-pressed={syncEnabled}
          aria-label="Toggle sync"
        />
      </div>

      <div className="settings-field">
        <label className="settings-label" htmlFor="sync-url">Sync server URL</label>
        <input
          id="sync-url"
          type="url"
          className="settings-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://nexusvault-sync.workers.dev"
          disabled={!syncEnabled}
        />
        <span className="settings-hint">
          Your self-hosted or managed NexusVault sync Worker.
        </span>
      </div>

      <div className="settings-field">
        <span className="settings-label">Status</span>
        <div className={`settings-status ${status === "error" ? "err" : "ok"}`}>
          {statusLabel[status] ?? status}
        </div>
        <span className="settings-hint">Last synced: {formatDate(lastSynced)}</span>
      </div>

      {saved && <div className="settings-status ok">Settings saved</div>}

      <button
        type="button"
        className="settings-btn primary"
        onClick={handleSave}
        disabled={!syncEnabled}
      >
        Save
      </button>
    </div>
  );
}

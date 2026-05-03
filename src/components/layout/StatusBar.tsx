import { useEditorStore } from "@stores/editor";
import { Circle, CheckCircle2, Loader2, WifiOff } from "lucide-react";

/** Formats a Unix timestamp (ms) as a relative time string */
function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ago`;
}

/**
 * Fixed status bar at the bottom of the app.
 * Shows: word count, auto-save status, and sync state.
 */
export function StatusBar() {
  const { wordCount, isSaving, lastSavedAt } = useEditorStore();

  return (
    <footer className="status-bar" role="status" aria-live="polite">
      {/* Word count */}
      <span className="status-item" id="status-word-count">
        {wordCount} {wordCount === 1 ? "word" : "words"}
      </span>

      <span className="status-divider" aria-hidden="true">
        ·
      </span>

      {/* Save status */}
      <span className="status-item status-save" id="status-save">
        {isSaving ? (
          <>
            <Loader2 size={12} className="spin" />
            Saving…
          </>
        ) : lastSavedAt ? (
          <>
            <CheckCircle2 size={12} className="icon-green" />
            Saved {formatRelativeTime(lastSavedAt)}
          </>
        ) : (
          <>
            <Circle size={12} className="icon-muted" />
            Not saved
          </>
        )}
      </span>

      <span className="status-divider" aria-hidden="true">
        ·
      </span>

      {/* Sync status — static placeholder until Phase 3 */}
      <span className="status-item status-sync" id="status-sync">
        <WifiOff size={12} className="icon-muted" />
        Local only
      </span>
    </footer>
  );
}

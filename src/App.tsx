import { useEffect } from "react";
import { AppLayout } from "@components/layout/AppLayout";
import { useVaultInit } from "@hooks/useVaultInit";
import { useVaultStore } from "@stores/vault";
import { useSettingsStore, applyTheme } from "@stores/settings";


/**
 * Application root.
 * Wraps the layout in any global providers needed in future phases
 * (e.g. RouterProvider, ThemeProvider, TauriEventBus).
 */
function App() {
  const { isInitialized } = useVaultInit();
  const { error } = useVaultStore();
  const { theme, loadAIProviderKey } = useSettingsStore();

  // Apply theme on mount and whenever preference changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Load API key from OS keychain on startup
  useEffect(() => {
    loadAIProviderKey();
  }, [loadAIProviderKey]);

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h2>Vault Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon spin">⟳</div>
        <h2>Loading Vault...</h2>
      </div>
    );
  }

  return <AppLayout />;
}

export default App;

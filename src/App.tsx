import { AppLayout } from "@components/layout/AppLayout";
import { useVaultInit } from "@hooks/useVaultInit";
import { useVaultStore } from "@stores/vault";

/**
 * Application root.
 * Wraps the layout in any global providers needed in future phases
 * (e.g. RouterProvider, ThemeProvider, TauriEventBus).
 */
function App() {
  const { isInitialized } = useVaultInit();
  const { error } = useVaultStore();

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

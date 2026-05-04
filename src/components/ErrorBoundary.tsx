import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="empty-state"
          style={{ height: "100vh", backgroundColor: "var(--nv-bg-primary)" }}
        >
          <div className="empty-state-icon" style={{ color: "#fa5252", opacity: 1 }}>
            ⚠️
          </div>
          <h2>Application Error</h2>
          <p>Something went wrong. Check the console for details.</p>
          <pre
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "var(--nv-bg-secondary)",
              borderRadius: "6px",
              color: "var(--nv-text-primary)",
              fontSize: "12px",
              maxWidth: "80%",
              overflowX: "auto",
            }}
          >
            {this.state.error?.message}
          </pre>
          <button
            type="button"
            className="sidebar-footer-btn"
            style={{ marginTop: "20px" }}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

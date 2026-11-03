import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Workspace from "./components/sentinel/Workspace";
import { Toaster } from "sonner";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] p-6 text-center">
          <div className="font-mono text-xs tracking-widest text-amber uppercase">Telemetry Error Encountered</div>
          <h2 className="text-xl font-bold text-ice">Sentinel Dashboard Reload Required</h2>
          <p className="max-w-md text-sm text-telem-muted">
            {this.state.error?.message || "An unexpected rendering exception was caught."}
          </p>
          <button
            onClick={() => {
              window.localStorage.removeItem("sentinel:cameras");
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="rounded bg-cyan/20 px-4 py-2 font-mono text-xs text-cyan hover:bg-cyan/30 transition-colors"
          >
            Reset Cached State & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Workspace />
        <Toaster position="bottom-right" theme="dark" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

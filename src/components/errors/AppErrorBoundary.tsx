import React from "react";

import { logAppError } from "@/lib/appLogger";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logAppError(error, {
      componentStack: errorInfo.componentStack,
      source: "AppErrorBoundary",
    });
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-xl border border-destructive/30 bg-card shadow-lg p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-destructive">
              Application Error
            </p>
            <h1 className="text-2xl font-black">The interface hit an unexpected error.</h1>
            <p className="text-sm text-muted-foreground">
              The error was captured locally so we can trace it while keeping the rest of the refactor safe.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 text-xs font-mono overflow-auto max-h-64">
            {this.state.error?.stack || this.state.error?.message || "Unknown error"}
          </div>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
}

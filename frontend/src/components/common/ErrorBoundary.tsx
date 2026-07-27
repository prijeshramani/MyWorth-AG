import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 text-slate-100">
          <div className="card-glass max-w-md w-full p-8 text-center border border-rose-500/30">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Something Went Wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              An unexpected application error occurred. You can safely refresh the view to restore operation.
            </p>
            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs font-mono text-rose-300 text-left mb-6 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-sky-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

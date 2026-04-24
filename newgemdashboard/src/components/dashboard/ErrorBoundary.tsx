import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 glass-surface rounded-2xl border border-red-500/20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-mono text-white mb-2 uppercase tracking-tight">Component Failure</h2>
          <p className="text-white/40 text-sm max-w-md mb-8 font-mono">
            {this.state.error?.message || 'An unexpected error occurred while rendering this module.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center space-x-2 px-6 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-full text-white text-xs font-mono uppercase tracking-widest"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

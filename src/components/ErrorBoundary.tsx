import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Radio, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Father\'s Radio ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('fathers_radio_settings_v1');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-container"
          className="min-h-screen w-full bg-stone-950 text-stone-100 flex items-center justify-center p-4 sm:p-8 select-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.6) 0%, rgba(12, 10, 9, 0.98) 100%)',
          }}
        >
          <div className="max-w-md w-full glass-card-dark rounded-3xl p-6 sm:p-8 border border-amber-500/20 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Vintage Radio Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Radio className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>

            {/* Error Headlines */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/30 text-red-300 text-[11px] font-mono uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Radio Frequency Interrupted</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                Transistor Signal Lost
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 font-sans leading-relaxed">
                The nostalgic frequency drifted offline. Don&apos;t worry — your memories and presets
                are safe.
              </p>
            </div>

            {/* Error Details (Foldable / Subtle) */}
            {this.state.error && (
              <div className="p-3 bg-black/50 rounded-xl border border-white/5 text-left overflow-hidden">
                <p className="text-[11px] font-mono text-amber-400/90 truncate">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                id="error-reload-btn"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Re-tune Radio
              </button>
              <button
                id="error-reset-settings-btn"
                onClick={this.handleResetStorage}
                className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-sky-400" />
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

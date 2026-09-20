import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Contextual label shown in the error card, e.g. "Drive details" */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Route-level error boundary — catches render/data errors in dynamic route
 * segments (drive details, applicant tracking) and shows a recoverable
 * obsidian/purple error card instead of crashing the whole dashboard shell.
 */
export class RouteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || "Something went wrong" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[RouteErrorBoundary${this.props.section ? `: ${this.props.section}` : ""}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
          <div className="nb-card p-8 max-w-md text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-950/30">
              <AlertTriangle className="h-6 w-6 text-rose-400" />
            </div>
            <h2 className="font-black text-lg tracking-tight mb-1 text-slate-100">
              {this.props.section ? `Couldn't load ${this.props.section}` : "Something went wrong"}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold mb-2">
              An unexpected error occurred while loading this view. Your data is safe — retrying usually resolves it.
            </p>
            <p className="text-[10px] text-muted-foreground font-mono bg-slate-900/60 border border-purple-950/40 rounded-lg p-2 mb-5 break-words">
              {this.state.message}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={this.handleRetry} className="nb-btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 active:scale-[0.98] transition-all duration-200">
                <RotateCcw className="h-3.5 w-3.5" />
                Try Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="nb-btn-secondary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5 active:scale-[0.98] transition-all duration-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

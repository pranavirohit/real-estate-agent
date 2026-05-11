"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallbackTitle?: string };

type State = { hasError: boolean; error: Error | null };

/**
 * Catches render errors in the onboarding / app flow so a white screen becomes a recoverable state.
 */
export class DokimosErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[DokimosErrorBoundary]", error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const title = this.props.fallbackTitle ?? "Something went wrong";
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-100 px-6 py-16">
          <p
            className="max-w-md text-center text-sm text-gray-800 sm:text-[15px]"
            style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
          >
            {title}
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 max-h-[40vh] max-w-full overflow-auto rounded-lg bg-white/80 p-3 text-left text-xs text-red-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            className="mt-8 h-12 rounded-xl bg-dokimos-accent px-8 text-sm font-medium text-white hover:bg-dokimos-accentHover"
            style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

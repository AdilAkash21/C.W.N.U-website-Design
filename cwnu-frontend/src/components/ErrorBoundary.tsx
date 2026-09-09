import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Frontend error', { message: error.message, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Something went wrong</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">This page could not be displayed</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Your data is safe. Refresh the page or return to the dashboard and try again.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700" onClick={() => window.location.reload()}>
              Refresh page
            </button>
            <Link className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200" to="/dashboard">
              Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }
}

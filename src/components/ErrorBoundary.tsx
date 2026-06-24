import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/** Top-level safety net: if any screen throws during render, show a recoverable
 *  fallback instead of a blank white screen. The "Start a new game" action clears
 *  the persisted save (in case a corrupt game state caused the crash) and reloads. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Westminster.sim: render error', error, info.componentStack);
  }

  private startFresh = () => {
    try {
      // drop only the live game (the usual culprit) and keep named saves; if the
      // blob can't be parsed, clear the lot so the next launch is guaranteed clean
      const raw = localStorage.getItem('westminstersim-save');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.state) {
        parsed.state.game = null;
        localStorage.setItem('westminstersim-save', JSON.stringify(parsed));
      } else {
        localStorage.removeItem('westminstersim-save');
      }
    } catch {
      try { localStorage.removeItem('westminstersim-save'); } catch { /* ignore */ }
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="shell">
        <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
            <p style={{ color: 'var(--muted)' }}>
              The game hit an unexpected error. You can start a new game to recover — your
              named saves are kept unless they were the cause.
            </p>
            <button className="btn" onClick={this.startFresh}>Start a new game</button>
          </div>
        </div>
      </div>
    );
  }
}

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

// Catches client-side render/commit errors (incl. the DOM mutations browser
// "translate this page" features inject, which otherwise throw removeChild
// NotFoundError and silently blank the whole island). Shows a recoverable
// message instead of nothing.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Dashboard crashed:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="status error">
          <strong>Something interrupted the page.</strong>
          <span className="sub">
            If your browser is auto-translating this page, turn translation off for this
            site — it conflicts with the live charts.
          </span>
          <button className="chip" style={{ marginTop: 10, cursor: "pointer" }} onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

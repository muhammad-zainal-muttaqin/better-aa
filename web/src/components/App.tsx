import ErrorBoundary from "./ErrorBoundary";
import Dashboard from "./Dashboard";

// Single hydration root: an error boundary around the dashboard so a client-side
// crash degrades to a visible, recoverable message instead of a blank panel.
export default function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

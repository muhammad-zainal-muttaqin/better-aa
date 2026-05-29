import type { Model } from "../lib/types";
import ErrorBoundary from "./ErrorBoundary";
import ChartsIsland from "./ChartsIsland";

// Hydration root for the (non-critical) charts only. Wrapped in an error
// boundary so a crash here degrades to a small message and never touches the
// static StatStrip / ModelTable rendered by Astro around it.
export default function App({ models }: { models: Model[] }) {
  return (
    <ErrorBoundary>
      <ChartsIsland models={models} />
    </ErrorBoundary>
  );
}

// Shared types for the better-aa Worker.
// The `Model` shape below is what we store in KV and serve to the frontend.
// Keep this file in sync with web/src/lib/types.ts.

export interface Model {
  id: string;
  name: string;
  slug: string;
  creator: string; // human-readable creator name, e.g. "OpenAI"
  creatorSlug: string; // e.g. "openai"

  // Quality
  intelligence: number | null; // Artificial Analysis Intelligence Index
  coding: number | null;
  math: number | null;

  // Performance
  speed: number | null; // median output tokens/sec
  latency: number | null; // median time to first token (seconds)

  // Price (USD per 1M tokens)
  priceInput: number | null;
  priceOutput: number | null;
  priceBlended: number | null;

  // Tokens consumed running the Intelligence Index evaluation.
  // Scraped from the models page (not in the API) — see scrape.ts.
  tokensUsed: number | null;

  // USD cost to run the Artificial Analysis Intelligence Index for this model.
  // Scraped from the models page (intelligence_index_cost.total_cost).
  costToRun: number | null;
}

export interface Snapshot {
  generatedAt: string; // ISO timestamp
  source: string; // where the data came from
  count: number;
  models: Model[];
}

// Shared types for the better-aa Worker.
// The `Model` shape below is what we store in KV and serve to the frontend.
// Keep this file in sync with web/src/lib/types.ts.

import type { ScrapedModel } from "./scrape";

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
  tokensUsed: number | null;

  // USD cost to run the Artificial Analysis Intelligence Index for this model.
  costToRun: number | null;

  // ---- Enrichment scraped from the /models page (see scrape.ts). ----
  // All nullable; rendered as "—" when missing.

  // Individual benchmark scores, 0-100 (%).
  gpqa: number | null; // GPQA Diamond (science reasoning)
  hle: number | null; // Humanity's Last Exam
  livecodebench: number | null; // LiveCodeBench
  math500: number | null; // MATH-500
  mmluPro: number | null; // MMLU-Pro
  mmmuPro: number | null; // MMMU-Pro (multimodal)
  scicode: number | null; // SciCode
  aime: number | null; // AIME 2025
  ifbench: number | null; // IFBench (instruction following)
  tau2: number | null; // tau2-bench (tool use / agents)
  terminalBench: number | null; // Terminal-Bench Hard
  lcr: number | null; // Long-Context Reasoning

  // Composite indices / raw-scale scores.
  agenticIndex: number | null; // 0-100
  omniscience: number | null; // can be negative
  gdpval: number | null; // raw GDPval dollar score
  multilingualAvg: number | null; // 0-100 (%)

  // Capabilities.
  contextWindow: number | null; // tokens
  maxOutput: number | null; // tokens
  inputModalities: string[]; // text/image/speech/video
  outputModalities: string[];
  reasoning: boolean | null;
  sizeClass: string | null; // Tiny | Small | Medium | Large

  // Provenance / licensing.
  releaseDate: string | null; // YYYY-MM-DD
  knowledgeCutoff: string | null; // YYYY-MM-DD
  license: string | null;
  openWeights: boolean | null;
  openness: string | null; // Proprietary | Open Weights (...)
  modelFamily: string | null;

  // Pricing extras.
  cachePrice: number | null; // USD / 1M cached-input tokens
  cacheDiscount: number | null; // 0-100 (%)

  // Performance distribution.
  speedP5: number | null;
  speedP95: number | null;
}

// The curated snapshot the website reads (/api/models): the surfaced creators.
export interface Snapshot {
  generatedAt: string; // ISO timestamp
  source: string; // where the data came from
  count: number;
  models: Model[];
}

// The FULL scraped catalog (every creator), stored separately and served at
// /api/catalog. We save everything even when the site only shows a subset.
export interface Catalog {
  generatedAt: string;
  source: string;
  count: number;
  models: ScrapedModel[];
}

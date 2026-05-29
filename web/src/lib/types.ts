// Mirror of worker/src/types.ts — keep in sync.

export interface Model {
  id: string;
  name: string;
  slug: string;
  creator: string;
  creatorSlug: string;

  intelligence: number | null;
  coding: number | null;
  math: number | null;

  speed: number | null;
  latency: number | null;

  priceInput: number | null;
  priceOutput: number | null;
  priceBlended: number | null;

  tokensUsed: number | null;
  costToRun: number | null;

  // ---- Enrichment scraped from the /models page. All nullable. ----

  // Individual benchmark scores, 0-100 (%).
  gpqa: number | null;
  hle: number | null;
  livecodebench: number | null;
  math500: number | null;
  mmluPro: number | null;
  mmmuPro: number | null;
  scicode: number | null;
  aime: number | null;
  ifbench: number | null;
  tau2: number | null;
  terminalBench: number | null;
  lcr: number | null;

  agenticIndex: number | null;
  omniscience: number | null;
  gdpval: number | null;
  multilingualAvg: number | null;

  contextWindow: number | null;
  maxOutput: number | null;
  inputModalities: string[];
  outputModalities: string[];
  reasoning: boolean | null;
  sizeClass: string | null;

  releaseDate: string | null;
  knowledgeCutoff: string | null;
  license: string | null;
  openWeights: boolean | null;
  openness: string | null;
  modelFamily: string | null;

  cachePrice: number | null;
  cacheDiscount: number | null;

  speedP5: number | null;
  speedP95: number | null;
}

export interface Snapshot {
  generatedAt: string;
  source: string;
  count: number;
  models: Model[];
}

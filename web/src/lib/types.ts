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
}

export interface Snapshot {
  generatedAt: string;
  source: string;
  count: number;
  models: Model[];
}

// Request-time data loading for the SSR page.
//
// Primary source: the `catalog:latest` KV entry (the FULL ~525-model catalog the
// worker scrapes daily). Read straight from the bound KV namespace so the site
// reflects the latest cron run with no rebuild/redeploy.
//
// Fallback: the baked `public/snapshot.json` (curated 7 creators). Used in local
// `astro dev` without KV, on a cold KV miss, or if a parse fails — so the page
// always renders, never errors.

import type { Model, Snapshot } from "./types";
import baked from "../../public/snapshot.json";

const CATALOG_KEY = "catalog:latest";

// Minimal KV surface we use (avoids a hard dep on @cloudflare/workers-types).
export interface KVGet {
  get(key: string): Promise<string | null>;
}

// Minimal shape of what we read from KV. The scraped catalog uses `outputTokens`
// where the UI Model uses `tokensUsed`; everything else lines up 1:1.
interface RawCatalog {
  generatedAt: string;
  source: string;
  count: number;
  models: (Model & { outputTokens?: number | null })[];
}

function toModel(m: Model & { outputTokens?: number | null }): Model {
  // tokensUsed is named outputTokens in the scraped catalog records.
  if ((m.tokensUsed === undefined || m.tokensUsed === null) && typeof m.outputTokens === "number") {
    return { ...m, tokensUsed: m.outputTokens };
  }
  return m;
}

export interface SiteData {
  models: Model[];
  generatedAt: string;
  source: string;
  /** "kv" = live catalog from KV; "baked" = build-time snapshot fallback. */
  origin: "kv" | "baked";
}

function bakedData(): SiteData {
  const snap = baked as unknown as Snapshot;
  return {
    models: snap.models,
    generatedAt: snap.generatedAt,
    source: snap.source,
    origin: "baked",
  };
}

// `kv` is the bound KVNamespace (Astro.locals.runtime.env.SNAPSHOT_KV) or
// undefined in environments without the binding.
export async function loadSiteData(kv: KVGet | undefined): Promise<SiteData> {
  if (!kv) return bakedData();
  try {
    const raw = await kv.get(CATALOG_KEY);
    if (!raw) return bakedData();
    const cat = JSON.parse(raw) as RawCatalog;
    if (!cat?.models?.length) return bakedData();
    return {
      models: cat.models.map(toModel),
      generatedAt: cat.generatedAt,
      source: cat.source,
      origin: "kv",
    };
  } catch {
    return bakedData();
  }
}

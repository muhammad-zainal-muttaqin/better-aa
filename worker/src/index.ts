// better-aa Worker
//
//  - scheduled(): once/day, fetch AA data -> filter -> normalize -> write KV.
//  - fetch():     GET /api/models  -> serve the KV snapshot (CORS + cache).
//                 GET /seed        -> manually trigger an ingest (guarded).
//
// The public site only ever reads /api/models, so it never touches AA and the
// 1000 req/day rate limit is never a concern.

import { fetchModels } from "./aa";
import { fetchCatalog, indexById } from "./scrape";
import type { ModelExtras, ScrapedModel } from "./scrape";
import type { Catalog, Model, Snapshot } from "./types";

export interface Env {
  SNAPSHOT_KV: KVNamespace;
  AA_API_KEY: string;
  SEED_TOKEN?: string;
}

const SNAPSHOT_KEY = "snapshot:latest";
const CATALOG_KEY = "catalog:latest";

// Copy every enrichment field off a scraped record onto an API model.
function enrich(m: Model, e: ModelExtras): void {
  if (typeof e.outputTokens === "number") m.tokensUsed = e.outputTokens;
  if (typeof e.costToRun === "number") m.costToRun = e.costToRun;

  m.gpqa = e.gpqa;
  m.hle = e.hle;
  m.livecodebench = e.livecodebench;
  m.math500 = e.math500;
  m.mmluPro = e.mmluPro;
  m.mmmuPro = e.mmmuPro;
  m.scicode = e.scicode;
  m.aime = e.aime;
  m.ifbench = e.ifbench;
  m.tau2 = e.tau2;
  m.terminalBench = e.terminalBench;
  m.lcr = e.lcr;

  m.agenticIndex = e.agenticIndex;
  m.omniscience = e.omniscience;
  m.gdpval = e.gdpval;
  m.multilingualAvg = e.multilingualAvg;

  m.contextWindow = e.contextWindow;
  m.maxOutput = e.maxOutput;
  m.inputModalities = e.inputModalities;
  m.outputModalities = e.outputModalities;
  m.reasoning = e.reasoning;
  m.sizeClass = e.sizeClass;

  m.releaseDate = e.releaseDate;
  m.knowledgeCutoff = e.knowledgeCutoff;
  m.license = e.license;
  m.openWeights = e.openWeights;
  m.openness = e.openness;
  m.modelFamily = e.modelFamily;

  m.cachePrice = e.cachePrice;
  m.cacheDiscount = e.cacheDiscount;

  m.speedP5 = e.speedP5;
  m.speedP95 = e.speedP95;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extra },
  });
}

async function ingest(env: Env): Promise<Snapshot> {
  if (!env.AA_API_KEY) {
    throw new Error("AA_API_KEY secret is not set (wrangler secret put AA_API_KEY)");
  }
  const models = await fetchModels(env.AA_API_KEY);
  const generatedAt = new Date().toISOString();

  // Scrape the page once: it gives us BOTH the full catalog (every creator,
  // stored under CATALOG_KEY) and the per-id enrichment for our curated set.
  // Best-effort: a scrape failure must not break the curated ingest.
  let catalog: ScrapedModel[] = [];
  try {
    catalog = await fetchCatalog();
    const extras = indexById(catalog);
    let hit = 0;
    for (const m of models) {
      const e = extras[m.id];
      if (!e) continue;
      enrich(m, e);
      hit++;
    }
    console.log(`Scrape merged: enriched ${hit}/${models.length} curated models`);

    // Store the FULL catalog separately so we keep everything for later, even
    // though the site only reads the curated snapshot.
    const fullCatalog: Catalog = {
      generatedAt,
      source: "artificialanalysis.ai/models (scraped)",
      count: catalog.length,
      models: catalog,
    };
    await env.SNAPSHOT_KV.put(CATALOG_KEY, JSON.stringify(fullCatalog), {
      metadata: { generatedAt, count: catalog.length },
    });
  } catch (err) {
    console.warn("Page scrape failed (continuing without enrichment):", err);
  }

  const snapshot: Snapshot = {
    generatedAt,
    source: "artificialanalysis.ai/api/v2 + /models scrape",
    count: models.length,
    models,
  };
  await env.SNAPSHOT_KV.put(SNAPSHOT_KEY, JSON.stringify(snapshot), {
    metadata: { generatedAt: snapshot.generatedAt, count: snapshot.count },
  });
  return snapshot;
}

export default {
  // Daily cron entrypoint.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      ingest(env)
        .then((s) => console.log(`Ingest OK: stored ${s.count} models at ${s.generatedAt}`))
        .catch((err) => console.error("Ingest failed:", err)),
    );
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Serve the stored snapshot.
    if (url.pathname === "/api/models") {
      const stored = await env.SNAPSHOT_KV.get(SNAPSHOT_KEY);
      if (!stored) {
        return json(
          { error: "No snapshot yet. Trigger /seed or wait for the daily cron." },
          503,
        );
      }
      return json(JSON.parse(stored), 200, {
        "Cache-Control": "public, max-age=3600",
      });
    }

    // Serve the FULL scraped catalog (every creator). Stored for completeness;
    // the site itself only reads /api/models.
    if (url.pathname === "/api/catalog") {
      const stored = await env.SNAPSHOT_KV.get(CATALOG_KEY);
      if (!stored) {
        return json({ error: "No catalog yet. Trigger /seed or wait for the daily cron." }, 503);
      }
      return json(JSON.parse(stored), 200, {
        "Cache-Control": "public, max-age=3600",
      });
    }

    // Manual ingest trigger. In production, guard with ?token=<SEED_TOKEN>.
    if (url.pathname === "/seed") {
      if (env.SEED_TOKEN && url.searchParams.get("token") !== env.SEED_TOKEN) {
        return json({ error: "Forbidden" }, 403);
      }
      try {
        const s = await ingest(env);
        return json({ ok: true, count: s.count, generatedAt: s.generatedAt });
      } catch (err) {
        return json({ ok: false, error: String(err) }, 500);
      }
    }

    // Tiny health/landing response.
    if (url.pathname === "/") {
      return json({
        name: "better-aa-worker",
        routes: ["/api/models", "/api/catalog", "/seed"],
      });
    }

    ctx.waitUntil(Promise.resolve());
    return json({ error: "Not found" }, 404);
  },
};

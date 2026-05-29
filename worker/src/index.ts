// better-aa Worker
//
//  - scheduled(): once/day, fetch AA data -> filter -> normalize -> write KV.
//  - fetch():     GET /api/models  -> serve the KV snapshot (CORS + cache).
//                 GET /seed        -> manually trigger an ingest (guarded).
//
// The public site only ever reads /api/models, so it never touches AA and the
// 1000 req/day rate limit is never a concern.

import { fetchModels } from "./aa";
import type { Snapshot } from "./types";

export interface Env {
  SNAPSHOT_KV: KVNamespace;
  AA_API_KEY: string;
  SEED_TOKEN?: string;
}

const SNAPSHOT_KEY = "snapshot:latest";

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
  const snapshot: Snapshot = {
    generatedAt: new Date().toISOString(),
    source: "artificialanalysis.ai/api/v2",
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
        routes: ["/api/models", "/seed"],
      });
    }

    ctx.waitUntil(Promise.resolve());
    return json({ error: "Not found" }, 404);
  },
};

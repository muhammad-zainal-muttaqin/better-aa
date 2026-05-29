# better-aa

A focused, faster alternative to [Artificial Analysis](https://artificialanalysis.ai/) that
shows only what matters for picking a model: **Intelligence, Speed, Price, and Tokens used** —
as a few clear charts plus one sortable table.

Models are limited to: **OpenAI, Google, Anthropic, Kimi (Moonshot), GLM (Zhipu), MiniMax,
MiMo (Xiaomi)**.

## How it works

```
Cloudflare Cron (1×/day)
  → Worker fetches the AA API (x-api-key) → filters the 7 creators → normalizes
  → writes one snapshot to Workers KV
Cloudflare Pages (Astro) → reads /api/models from the Worker → charts + table
```

The public site **never calls Artificial Analysis** — it only reads our stored KV snapshot.
One fetch per day is far under the free tier's 1,000 req/day, so the rate limit is a non-issue.

```
better-aa/
├─ worker/   Cloudflare Worker: daily ingest + /api/models read endpoint
└─ web/      Astro + React + Recharts dashboard (Cloudflare Pages)
```

## Prerequisites

- Node 18+ and a Cloudflare account (`npx wrangler login`)
- A free Artificial Analysis API key — create an account at
  <https://artificialanalysis.ai/insights> and generate a key.

## 1. Worker setup

```bash
cd worker
npm install

# Create the KV namespace, then paste the printed id into wrangler.toml
npx wrangler kv namespace create SNAPSHOT_KV

# Store the AA key as a secret (never commit it)
npx wrangler secret put AA_API_KEY
```

### Run + seed locally

```bash
npm run dev            # wrangler dev --test-scheduled, serves http://localhost:8787

# In another terminal — populate KV immediately (don't wait for the cron):
curl http://localhost:8787/seed
curl http://localhost:8787/api/models     # normalized snapshot

# Or fire the scheduled handler directly:
curl "http://localhost:8787/__scheduled?cron=0+6+*+*+*"
```

> On the first run the Worker logs the distinct creator slugs returned by AA
> (`AA distinct creator slugs: ...`). Use that to confirm/adjust the aliases in
> `worker/src/aa.ts` (`ALLOWED_CREATORS`) and the `tokensUsed` field mapping in
> `normalize()`.

### Deploy

```bash
npm run deploy
```

The cron (`0 6 * * *`, daily 06:00 UTC) is registered automatically. For a guarded manual
trigger in production, set `SEED_TOKEN` in `wrangler.toml` and call `/seed?token=...`.

## 2. Web setup

```bash
cd web
npm install
cp .env.example .env        # set PUBLIC_API_BASE to your Worker URL
npm run dev                 # http://localhost:4321
```

Deploy to **Cloudflare Pages**: build command `npm run build`, output directory `dist`, and
set the `PUBLIC_API_BASE` environment variable to your deployed Worker URL
(`https://better-aa-worker.<subdomain>.workers.dev`).

## Notes

- **Tokens used**: the v2 API does not expose this. The Worker scrapes it from the embedded
  data on the `/models` page (`worker/src/scrape.ts` → `intelligence_index_token_counts`)
  and joins it to the API models by the shared `id` UUID. This is best-effort — if the page
  markup changes, the ingest continues with `tokensUsed: null` rather than failing.
- Keep `worker/src/types.ts` and `web/src/lib/types.ts` in sync.
- Independent project, not affiliated with Artificial Analysis.

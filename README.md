# better-aa

A focused, faster alternative to [Artificial Analysis](https://artificialanalysis.ai/) that
surfaces what matters for picking a model — **Intelligence, key benchmarks (GPQA, LiveCodeBench,
AIME, MMLU-Pro, HLE), speed, latency, price, context window, modalities, cost-to-run** — as a few
clear charts plus one wide, sortable table.

The **site** shows: **OpenAI, Google, Anthropic, Kimi (Moonshot), GLM (Z AI / Zhipu), MiniMax,
MiMo (Xiaomi)**. But the ingest **scrapes and stores the full catalog (every creator, ~525
models)** so we can expand coverage any day without re-scraping.

## How it works

```
Cloudflare Cron (1×/day)
  → Worker fetches the AA API (x-api-key) for the curated creators
  → scrapes the /models page for the rich per-model dataset the API omits
  → enriches the curated set + stores the FULL scraped catalog
  → writes two KV values: snapshot:latest (curated) and catalog:latest (everything)
Cloudflare Pages (Astro) → reads /api/models from the Worker → charts + table
```

The public site **never calls Artificial Analysis** — it only reads our stored KV snapshot.
One fetch per day is far under the free tier's 1,000 req/day, so the rate limit is a non-issue.

Endpoints: `/api/models` (curated, what the site reads) · `/api/catalog` (full scraped catalog,
every creator) · `/seed?token=…` (guarded manual ingest).

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

- **Rich data via scraping**: the v2 API only exposes a handful of fields. The Worker scrapes
  the `/models` page (`worker/src/scrape.ts`), where Next.js embeds the *complete* catalog as
  escaped JSON. Each model object begins with `{"additional_text":` and is keyed by the same
  `id` UUID as the API. We parse every object and lift ~30 extra fields: individual benchmark
  scores (GPQA, HLE, LiveCodeBench, MATH-500, MMLU-Pro, MMMU-Pro, SciCode, AIME, IFBench, tau2,
  Terminal-Bench, LCR), agentic/omniscience/GDPval scores, context window, max output, input/
  output modalities, release + knowledge-cutoff dates, license / open-weights status, speed
  percentiles, multilingual average, and cache pricing.
- **Store everything, show a subset**: the scrape keeps the full catalog (every creator) in
  `catalog:latest` / `/api/catalog`; the site only reads the curated `snapshot:latest`. Adding a
  creator to the site is just a filter change — the data is already stored.
- Benchmarks are normalized to 0-100 (%) at scrape time; composite indices stay on their native
  0-100 scale; `omniscience` can be negative; `gdpval` is a raw dollar score.
- Best-effort: if the page markup changes, the ingest continues with null enrichment rather
  than failing.
- Keep `worker/src/types.ts` and `web/src/lib/types.ts` in sync.
- Independent project, not affiliated with Artificial Analysis.

# CLAUDE.md — better-aa

**Mission: we are making better artificialanalysis.** Every change should push the site
toward being a sharper, faster, more useful version of Artificial Analysis — not just a
clone. The user wants this to be a genuinely *dynamic* product (live, fresh data and rich
interactivity), not a static brochure.

A focused alternative to Artificial Analysis: charts + a tabbed, heatmapped, sortable
table of LLM intelligence/benchmarks/speed/price/cost. See `README.md` for full setup.
This file records the **non-obvious rules an agent must follow** so changes don't break
the site.

## Layout
- `worker/` — Cloudflare Worker: daily cron ingest (`0 6 * * *`) → AA API + scrape of the
  `/models` page → writes KV `snapshot:latest` (curated 7 creators) + `catalog:latest`
  (full ~525-model catalog). Endpoints `/api/models`, `/api/catalog`, `/seed?token=`.
- `web/` — Astro **SSR** site (`output: "server"`, `@astrojs/cloudflare` adapter) + one
  React island (charts only) + Recharts. Deployed to Cloudflare Pages. The page is
  server-rendered on every request; it reads the **full live catalog** (`catalog:latest`,
  ~527 models) straight from the bound `SNAPSHOT_KV` namespace — see `web/src/lib/data.ts`.
  So the daily cron's data shows up with **no rebuild/redeploy**. `public/snapshot.json` is
  only a dev/cold-start fallback (when KV is unbound or empty).

## ⚠️ The one rule that must never regress: HTML-first robustness
The site **must render under any circumstances** — JavaScript disabled, ad/DOM-mutating
extensions, browser auto-translate. This was a real production bug (blank page in the
user's normal browser, worked only in incognito). The fix, which must be preserved:

- **Data renders as static HTML on the server (per request).** `web/src/pages/index.astro`
  loads the catalog via `loadSiteData()` and renders `StatStrip` + `ModelTable` to plain
  HTML (no `client:load`). Visible with JS fully off. SSR preserves HTML-first — the server
  always emits the full table/KPIs even when the charts island can't hydrate. The React
  server renderer is aliased to `react-dom/server.edge` in `astro.config.mjs` because
  workerd has no `MessageChannel` (the `.browser` build crashes the Worker otherwise).
- **Charts are the ONLY hydrated island** (`App.tsx` → `ErrorBoundary` → `ChartsIsland`),
  `client:load`. If it crashes, the error boundary shows a small note and the table is
  untouched. Never move critical data into a React island.
- **Interactivity is framework-free.** Sort, filter, and the view tabs are a vanilla
  `<script is:inline>` in `index.astro` that reorders/hides existing `<tr>`s and swaps a
  CSS class. It must only *enhance* — never be required to see data.
- `<main translate="no">` is intentional (translate rewrites text nodes and crashes
  hydrated React via `removeChild`). Keep it.
- **When editing the table/KPIs, always re-verify with JS disabled** (see Verify below).
  `ModelTable.tsx` keeps `useState`/`onClick` for the SSR render only — it is never
  hydrated; the vanilla script does the real work. Don't "fix" that by hydrating it.

## Table design (current)
- **Preset view tabs** Overview / Benchmarks / Speed & Price. Every column is in the HTML;
  each `<th>/<td>` is tagged `col v-overview|v-bench|v-price`. The `<table>` carries a
  baked default class `view-overview`; CSS `.view-X .col:not(.v-X){display:none}` shows
  only the active view. JS-off → Overview renders. Tabs are config-driven in
  `ModelTable.tsx` (`COLUMNS[].views`).
- **Heatmap** is baked into each numeric `<td>` as an inline `background` at build time via
  `heatBg()` in `web/src/lib/theme.ts` (goodness-graded; `heat: "high"|"low"` per column,
  `"low"` inverts for price/latency/cost/tokens). No JS — colors travel with rows on sort.
- Add/remove a column by editing the `COLUMNS` array only. Heat uses `heatVal` (defaults to
  `sortVal`) and skips the `0 = missing` sentinel via `real()`/`finite()`.

## Data conventions
- **`0` means "missing"** for price and latency in the snapshot. Always filter with
  `real()` (>0) before charts/heat/"best" picks; use `finite()` for intelligence/speed.
- Cost-to-run is derived; read from the scraped `intelligence_index_cost.total_cost`.
- Keep `worker/src/types.ts` and `web/src/lib/types.ts` **in sync** (manual mirror).
- Scrape is best-effort: model object marker is `{"additional_text":`, escaped JSON in the
  Next.js payload; on markup change, ingest continues with null enrichment, not failure.
- The live site reads `catalog:latest` from KV **at request time** (SSR) — fresh cron data
  appears with no rebuild. `public/snapshot.json` is only the fallback when KV is unbound.
- KV binding + Worker runtime config live in `web/wrangler.toml` (`SNAPSHOT_KV`,
  `compatibility_flags = ["nodejs_compat"]`). Keep it: the SSR Worker won't run without them.
- Dep pins: **Astro stays 5.x and `@astrojs/cloudflare` stays 12.x.** Astro 6 forces
  adapter 13, which moved to the Cloudflare *Workers* assets model (reserved `ASSETS`
  binding) and breaks this Pages deployment. Everything else tracks latest stable.

## Build & deploy (Pages is a Direct-Upload project — deploy is manual, NOT git-triggered)
The Pages project `better-aa` has `source: null` (Direct Upload), so `git push` does NOT
deploy. Converting to git-auto-deploy needs the Cloudflare↔GitHub App OAuth, a one-time
interactive dashboard step (can't be done with an API token alone). Until then:
```
# web (SSR build → dist/ contains a _worker.js; bindings come from wrangler.toml)
cd web && npm run build
npx wrangler pages deploy dist --project-name=better-aa --branch=main --commit-dirty=true
# worker
cd worker && npm run deploy
```
Auth via env: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Always commit + push (see
memory `always-commit-push`); deploy as part of finishing a unit of work.

## Verify before declaring done
1. `cd web && npm run build` must succeed.
2. Serve the SSR build locally with the KV binding + compat flags:
   `npx wrangler pages dev dist --port 8790 --kv SNAPSHOT_KV --compatibility-date=2024-11-01
   --compatibility-flags=nodejs_compat` (local KV is empty → exercises the snapshot
   fallback, which is fine for the no-JS checks). Don't pipe its output to `head` — that
   SIGPIPEs the server. If it complains about a stale `.wrangler/deploy/config.json`, delete it.
3. **JS-disabled check (critical):** with JS off → all rows + KPIs visible, Overview columns
   shown, heatmap colors present.
4. JS-on: tabs swap columns, header click sorts, filter hides rows, charts hydrate, the
   release-date filter reshapes table + charts + KPIs together.
5. Translate-style DOM mutation must not blank the page or throw.
   (A headless-Chrome `playwright-core` script covering these scenarios is the standard
   check — write it to a temp `_verify.cjs`, run, then delete it. Use `waitUntil:
   "domcontentloaded"` + wait for `.recharts-surface`; `networkidle` times out on the full
   catalog. To verify live KV/full-catalog, point the script at a Pages preview URL.)

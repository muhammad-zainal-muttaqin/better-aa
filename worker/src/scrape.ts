// Scraper for the rich per-model dataset the official v2 API does NOT expose.
//
// The /models page (Next.js App Router) embeds the *complete* model catalog as
// escaped JSON — far more than the API: individual benchmark scores (GPQA, HLE,
// LiveCodeBench, AIME, MMLU-Pro, …), context window, max output, input/output
// modalities, release + knowledge-cutoff dates, license / open-weights status,
// speed percentiles, multilingual scores, cache pricing, and the token counts /
// cost used to run the Intelligence Index.
//
// Each model object in the payload begins with `{"additional_text":` and is a
// self-contained JSON object keyed by a UUID `id` that matches the API `id`.
//
// We scrape EVERY creator (the full catalog is stored), then the caller decides
// which subset to surface on the site. Best-effort: if the markup changes or the
// fetch fails, the caller falls back to null values and the ingest still works.

const MODELS_PAGE = "https://artificialanalysis.ai/models";

// Every model object in the embedded payload starts with this key first.
const MODEL_START = '{"additional_text":';

// Enrichment fields lifted off each scraped model. All optional / nullable —
// the page is the only source, so anything missing stays null.
export interface ModelExtras {
  // Token counts + cost to run the Intelligence Index.
  inputTokens: number | null;
  outputTokens: number | null; // == tokensUsed
  indexTokensTotal: number | null;
  costToRun: number | null; // USD, AA's intelligence_index_cost.total_cost
  costPerMOutput: number | null; // intelligence_index_per_m_output_tokens

  // Individual benchmark scores, normalized to 0-100 (%).
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

  // Composite indices (already 0-100) and raw-scale scores.
  agenticIndex: number | null;
  omniscience: number | null; // can be negative
  gdpval: number | null; // raw GDPval dollar score
  multilingualAvg: number | null; // 0-100 (%)

  // Capabilities.
  contextWindow: number | null; // tokens
  maxOutput: number | null; // tokens
  inputModalities: string[]; // subset of text/image/speech/video
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
  cacheDiscount: number | null; // 0-100 (%) off input price on cache hit

  // Performance distribution (output tokens/sec).
  speedP5: number | null;
  speedP95: number | null;
  ttftMedian: number | null; // median time to first chunk (s)
}

// A self-contained model record built purely from the scraped page — identity
// + core metrics + every ModelExtras field. This is what we store for the FULL
// catalog (all creators), independent of the API.
export interface ScrapedModel extends ModelExtras {
  id: string;
  name: string;
  slug: string;
  creator: string;
  creatorSlug: string;

  intelligence: number | null; // intelligence_index (0-100)
  coding: number | null; // coding_index
  math: number | null; // math_index

  speed: number | null; // median output tokens/sec
  latency: number | null; // median time to first chunk (s)

  priceInput: number | null; // USD / 1M
  priceOutput: number | null; // USD / 1M
  priceBlended: number | null; // computed 3:1 input:output
}

// 0-1 fraction -> 0-100 percent, 1 decimal. null-safe.
function pct(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.round(v * 1000) / 10
    : null;
}

// Pass-through finite number or null.
function n(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function modalities(m: any, dir: "input" | "output"): string[] {
  const kinds = ["text", "image", "speech", "video"];
  return kinds.filter((k) => m[`${dir}_modality_${k}`] === true);
}

// String-aware brace matching so quoted braces inside values don't corrupt the
// depth count. Returns the raw object slice and the index just past it.
function extractObject(html: string, from: number): { raw: string; end: number } | null {
  let depth = 0;
  for (let j = from; j < html.length; j++) {
    const c = html[j];
    if (c === '"') {
      j++;
      while (j < html.length && html[j] !== '"') {
        if (html[j] === "\\") j++;
        j++;
      }
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return { raw: html.slice(from, j + 1), end: j + 1 };
    }
  }
  return null;
}

function toExtras(m: any): ModelExtras {
  const tc = m.intelligence_index_token_counts ?? {};
  const cost = m.intelligence_index_cost ?? {};
  const ts = m.timescaleData ?? {};
  return {
    inputTokens: n(tc.input_tokens),
    outputTokens: n(tc.output_tokens),
    indexTokensTotal: n(m.indexTokensTotal),
    costToRun: n(cost.total_cost),
    costPerMOutput: n(m.intelligence_index_per_m_output_tokens),

    gpqa: pct(m.gpqa),
    hle: pct(m.hle),
    livecodebench: pct(m.livecodebench),
    math500: pct(m.math_500),
    mmluPro: pct(m.mmlu_pro),
    mmmuPro: pct(m.mmmu_pro),
    scicode: pct(m.scicode),
    aime: pct(m.aime25 ?? m.aime),
    ifbench: pct(m.ifbench),
    tau2: pct(m.tau2),
    terminalBench: pct(m.terminalbench_hard),
    lcr: pct(m.lcr),

    agenticIndex: n(m.agentic_index),
    omniscience: n(m.omniscience),
    gdpval: n(m.gdpval),
    multilingualAvg: pct(m.multilingual_aa?.average?.score),

    contextWindow: n(m.context_window_tokens),
    maxOutput: n(m.output_tokens),
    inputModalities: modalities(m, "input"),
    outputModalities: modalities(m, "output"),
    reasoning: typeof m.reasoning_model === "boolean" ? m.reasoning_model : null,
    sizeClass: str(m.size_class),

    releaseDate: str(m.release_date),
    knowledgeCutoff: str(m.knowledge_cutoff_date),
    license: str(m.license_name),
    openWeights: typeof m.is_open_weights === "boolean" ? m.is_open_weights : null,
    openness: str(m.open_source_categorization),
    modelFamily: str(m.model_family_slug),

    cachePrice: n(m.cache_hit_price),
    cacheDiscount: pct(m.cache_hit_discount_percent),

    speedP5: n(ts.percentile_05_output_speed),
    speedP95: n(ts.percentile_95_output_speed),
    ttftMedian: n(ts.median_time_to_first_chunk),
  };
}

function toScrapedModel(m: any): ScrapedModel | null {
  const id = str(m.id);
  if (!id) return null;
  const creator = m.model_creators ?? {};
  const ts = m.timescaleData ?? {};
  const pin = n(m.price_1m_input_tokens);
  const pout = n(m.price_1m_output_tokens);
  return {
    ...toExtras(m),
    id,
    name: str(m.name) ?? str(m.short_name) ?? str(m.slug) ?? id,
    slug: str(m.slug) ?? "",
    creator: str(creator.name) ?? "Unknown",
    creatorSlug: (str(creator.slug) ?? "").toLowerCase(),

    intelligence: n(m.intelligence_index),
    coding: n(m.coding_index),
    math: n(m.math_index),

    speed: n(ts.median_output_speed),
    latency: n(ts.median_time_to_first_chunk),

    priceInput: pin,
    priceOutput: pout,
    priceBlended:
      pin !== null && pout !== null ? Math.round(((3 * pin + pout) / 4) * 1000) / 1000 : null,
  };
}

// Fetch + parse EVERY model on the page. Returns the full catalog. Skipping
// nothing — the caller stores it all and surfaces whatever subset it wants.
export async function fetchCatalog(): Promise<ScrapedModel[]> {
  const res = await fetch(MODELS_PAGE, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`models page ${res.status}`);

  // Unescape the embedded JSON strings enough to expose keys/values.
  const html = (await res.text()).replace(/\\"/g, '"');

  const catalog: ScrapedModel[] = [];
  let i = 0;
  while ((i = html.indexOf(MODEL_START, i)) !== -1) {
    const ext = extractObject(html, i);
    if (!ext) break;
    i = ext.end;
    let obj: any;
    try {
      obj = JSON.parse(ext.raw);
    } catch {
      continue;
    }
    if (obj?.deleted === true) continue;
    const sm = toScrapedModel(obj);
    if (sm) catalog.push(sm);
  }
  console.log(`Scrape: parsed ${catalog.length} models (full catalog)`);
  return catalog;
}

// Convenience: index the catalog by id for the API-enrichment join.
export function indexById(catalog: ScrapedModel[]): Record<string, ModelExtras> {
  const map: Record<string, ModelExtras> = {};
  for (const m of catalog) map[m.id] = m;
  return map;
}

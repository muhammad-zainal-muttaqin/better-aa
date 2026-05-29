// Scraper for data the official API doesn't expose.
//
// The /models page (Next.js App Router) embeds a rich per-model dataset inside
// escaped JSON, including `intelligence_index_token_counts` — the input/output
// tokens used to run the Artificial Analysis Intelligence Index. The v2 API
// omits this entirely.
//
// We join the token counts back to the API models by the shared `id` UUID, then
// the caller derives:
//   - tokensUsed  = output_tokens
//   - costToRun   = input_tokens·priceInput + output_tokens·priceOutput  (per 1M)
//
// That formula reproduces AA's own `intelligence_index_cost.total_cost` exactly
// (verified against the page), and covers far more models than AA's embedded
// cost field (which only ships for first-party providers). Best-effort: if the
// markup changes or the fetch fails, the caller falls back to null values.

const MODELS_PAGE = "https://artificialanalysis.ai/models";

const UUID_RE =
  /"id":"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/g;
const TOKEN_COUNTS_RE = /"intelligence_index_token_counts":\{([^}]*)\}/g;

export interface ModelExtras {
  inputTokens: number | null;
  outputTokens: number | null;
}

// Returns a map of model id -> { inputTokens, outputTokens }.
export async function fetchModelExtras(): Promise<Record<string, ModelExtras>> {
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

  // Index every model UUID once so we can attribute each token-count block to
  // the nearest preceding model id (keys are emitted alphabetically within each
  // object, so "id" always precedes "intelligence_index_token_counts").
  const ids: Array<{ pos: number; id: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = UUID_RE.exec(html))) ids.push({ pos: m.index, id: m[1] });

  const map: Record<string, ModelExtras> = {};
  while ((m = TOKEN_COUNTS_RE.exec(html))) {
    let obj: any;
    try {
      obj = JSON.parse("{" + m[1] + "}");
    } catch {
      continue;
    }
    const out = typeof obj.output_tokens === "number" ? obj.output_tokens : null;
    const inp = typeof obj.input_tokens === "number" ? obj.input_tokens : null;
    if (out === null && inp === null) continue;

    // Nearest preceding id.
    let best: string | null = null;
    for (const it of ids) {
      if (it.pos < m.index) best = it.id;
      else break;
    }
    if (best) map[best] = { inputTokens: inp, outputTokens: out };
  }
  return map;
}

// Scraper for data the official API doesn't expose.
//
// The /models page (Next.js App Router) embeds a rich per-model dataset inside
// escaped JSON. It includes `intelligence_index_token_counts` — the tokens used
// to run the Artificial Analysis Intelligence Index — which the v2 API omits.
//
// We join it back to the API models by the shared `id` UUID. Best-effort: if the
// markup changes or the fetch fails, the caller falls back to null token counts.

const MODELS_PAGE = "https://artificialanalysis.ai/models";

const UUID_RE =
  /"id":"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/g;
const TOKEN_COUNTS_RE = /"intelligence_index_token_counts":\{([^}]*)\}/g;

// Returns a map of model id -> total output tokens used for the Intelligence Index.
export async function fetchTokenCounts(): Promise<Record<string, number>> {
  const res = await fetch(MODELS_PAGE, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; better-aa/0.1; +https://github.com/muhammad-zainal-muttaqin/better-aa)",
      accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`models page ${res.status}`);

  // Unescape the embedded JSON strings enough to expose keys/values.
  const html = (await res.text()).replace(/\\"/g, '"');

  // Index every model UUID once so we can attribute each token-count block to
  // the nearest preceding model id (keys are emitted in alphabetical order, so
  // "id" always precedes "intelligence_index_token_counts" within an object).
  const ids: Array<{ pos: number; id: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = UUID_RE.exec(html))) ids.push({ pos: m.index, id: m[1] });

  const map: Record<string, number> = {};
  while ((m = TOKEN_COUNTS_RE.exec(html))) {
    let obj: any;
    try {
      obj = JSON.parse("{" + m[1] + "}");
    } catch {
      continue;
    }
    const tokens = obj.output_tokens ?? obj.output ?? null;
    if (tokens === null) continue;

    // Nearest preceding id (binary search would be faster; linear is fine here).
    let best: string | null = null;
    for (const it of ids) {
      if (it.pos < m.index) best = it.id;
      else break;
    }
    if (best) map[best] = tokens;
  }
  return map;
}

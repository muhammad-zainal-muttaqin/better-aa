// Per-creator color coding shared between every chart and the table, plus
// number formatters and data-hygiene helpers used across the dashboard.

// Keyed by the creator NAME returned by the AA API (verified against live data).
// Categorical data-encoding hues — calibrated for a dark surface and spread
// around the wheel so the recognizable labs stay distinct. The full catalog has
// ~50 creators; these are the anchors, the rest get a stable hashed hue below.
export const CREATOR_COLORS: Record<string, string> = {
  Anthropic: "#d97757", // clay
  Mistral: "#fb5e3c", // red-orange
  Xiaomi: "#f3a23b", // amber (MiMo)
  Amazon: "#e9c046", // gold (Nova)
  NVIDIA: "#84c019", // lime (brand green)
  OpenAI: "#10a37f", // emerald
  "Z AI": "#22b8cf", // cyan  (GLM)
  Meta: "#1c8ef5", // sky (Llama)
  Google: "#4d8bf0", // azure
  DeepSeek: "#6d6af5", // indigo
  Kimi: "#8b7cf6", // iris
  Alibaba: "#a86cf0", // violet (Qwen)
  Microsoft: "#c45cf0", // purple (Phi)
  Cohere: "#de4fd0", // magenta
  MiniMax: "#f0577f", // rose
  xAI: "#e5e9f0", // silver (brand monochrome — Grok)
};

// Stable per-creator fallback for the long tail of labs (Liquid AI, IBM, Reka,
// …). FNV-1a hash → a hue, with saturation/lightness pinned to a band that reads
// on the dark surface. Deterministic, so a lab keeps its color across renders and
// new labs in the catalog get one automatically — no gray "unknown" bucket.
function hashColor(name: string): string {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = h >>> 0;
  const hue = h % 360;
  const sat = 52 + (h % 20); // 52–71%
  const light = 60 + ((h >> 10) % 12); // 60–71%
  return `hsl(${hue}deg ${sat}% ${light}%)`;
}

export function creatorColor(creator: string): string {
  return CREATOR_COLORS[creator] ?? hashColor(creator);
}

// The AA snapshot stores "missing" as 0 for price and latency. Treat any
// non-positive number as absent so it never poisons a log scale or shows up as
// a zero-width "cheapest"/"fastest" bar. Use for price + latency metrics.
export function real(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

// Intelligence/speed can legitimately be any finite value >= 0.
export function finite(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function fmtPrice(v: number | null): string {
  if (v === null) return "—";
  if (v === 0) return "$0";
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(3)}`;
  if (v >= 100) return `$${v.toFixed(0)}`;
  return `$${v.toFixed(2)}`;
}

export function fmtSpeed(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(0)} t/s`;
}

export function fmtLatency(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(2)} s`;
}

export function fmtIndex(v: number | null): string {
  return v === null ? "—" : v.toFixed(1);
}

// USD cost to run the full Intelligence Index — ranges from cents to thousands.
export function fmtCost(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  if (v >= 100) return `$${v.toFixed(0)}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(3)}`;
}

export function fmtTokens(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

// Benchmark score, already 0-100 (%). Renders "—" when absent.
export function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}

// Context window / max output tokens -> compact "128k" / "1M".
export function fmtContext(v: number | null): string {
  if (v === null || v <= 0) return "—";
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return `${Math.round(v / 1000)}k`;
}

// ISO date -> "Mar 2026". Null-safe.
export function fmtDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

// ---- Heatmap ----------------------------------------------------------------
// Goodness-graded cell background, baked into static HTML at build time (no JS).
// Normalizes a value to t∈[0,1] where 1 = best in its column, 0 = worst, then
// returns a subtle accent-teal tint. `lowerBetter` inverts the scale for metrics
// where smaller wins (price, latency, cost-to-run, tokens-used). Returns "" for
// missing values or a degenerate (flat) column so they stay un-tinted.
export function heatBg(
  value: number | null,
  min: number,
  max: number,
  lowerBetter = false,
): string {
  if (value === null || !Number.isFinite(value)) return "";
  if (max <= min) return "";
  let t = (value - min) / (max - min); // 0 = worst raw, 1 = best raw
  if (lowerBetter) t = 1 - t;
  t = Math.max(0, Math.min(1, t));
  // 0.04 floor keeps low cells faintly visible; 0.26 ceiling stays readable.
  const alpha = (0.04 + 0.22 * t).toFixed(3);
  return `rgba(45, 212, 191, ${alpha})`;
}

// Class-based variant of the heatmap — returns "h0".."h10" (or "" for missing /
// flat columns). Lets each cell carry a tiny shared class instead of a unique
// inline `background`, so a 500-row × 15-metric grid ships ~8k fewer style
// attributes (smaller HTML, far cheaper style recalc). The .h0–.h10 ramp is
// defined once in index.astro and mirrors the heatBg alpha steps.
export function heatClass(
  value: number | null,
  min: number,
  max: number,
  lowerBetter = false,
): string {
  if (value === null || !Number.isFinite(value)) return "";
  if (max <= min) return "";
  let t = (value - min) / (max - min);
  if (lowerBetter) t = 1 - t;
  t = Math.max(0, Math.min(1, t));
  return "h" + Math.round(t * 10);
}

// Compact modality glyphs for a capabilities cell.
const MODALITY_GLYPH: Record<string, string> = {
  text: "T",
  image: "🖼",
  speech: "🔊",
  video: "🎬",
};
export function modalityGlyphs(mods: string[] | undefined): string {
  if (!mods || mods.length === 0) return "—";
  return mods.map((m) => MODALITY_GLYPH[m] ?? m[0]?.toUpperCase()).join(" ");
}

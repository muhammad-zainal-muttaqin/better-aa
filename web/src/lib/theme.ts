// Per-creator color coding shared between every chart and the table, plus
// number formatters and data-hygiene helpers used across the dashboard.

// Keyed by the creator NAME returned by the AA API (verified against live data).
// Categorical data-encoding hues — calibrated for a dark surface, kept distinct
// across all seven creators without tipping into rainbow noise.
export const CREATOR_COLORS: Record<string, string> = {
  Anthropic: "#d97757", // clay
  OpenAI: "#10a37f", // emerald
  Google: "#4d8bf0", // azure
  Kimi: "#8b7cf6", // iris
  "Z AI": "#22b8cf", // cyan  (GLM)
  MiniMax: "#f0577f", // rose
  Xiaomi: "#f3a23b", // amber (MiMo)
};

const FALLBACK_COLOR = "#9aa0aa";

export function creatorColor(creator: string): string {
  return CREATOR_COLORS[creator] ?? FALLBACK_COLOR;
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

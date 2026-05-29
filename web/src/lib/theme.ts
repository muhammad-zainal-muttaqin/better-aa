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

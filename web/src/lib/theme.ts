// Per-creator color coding shared between every chart and the table, plus
// number formatters used across the dashboard.

// Keyed by the creator NAME returned by the AA API (verified against live data).
// Categorical data-encoding hues — calibrated for a dark surface.
export const CREATOR_COLORS: Record<string, string> = {
  OpenAI: "#10a37f",
  Google: "#5b8def",
  Anthropic: "#d4836a",
  Kimi: "#9b8cf0",
  "Z AI": "#38bdf8", // GLM
  MiniMax: "#f25d6b",
  Xiaomi: "#f0a040", // MiMo
};

const FALLBACK_COLOR = "#94a3b8";

export function creatorColor(creator: string): string {
  return CREATOR_COLORS[creator] ?? FALLBACK_COLOR;
}

export function fmtPrice(v: number | null): string {
  if (v === null) return "—";
  if (v === 0) return "$0";
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(3)}`;
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

export function fmtTokens(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

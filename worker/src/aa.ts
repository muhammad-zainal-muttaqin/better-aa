// Artificial Analysis API client + normalization.
//
// Endpoint:   GET https://artificialanalysis.ai/api/v2/data/llms/models
// Auth:       x-api-key header (free key, 1000 req/day). We call it once/day.
// Docs:       https://artificialanalysis.ai/documentation

import type { Model } from "./types";

const AA_ENDPOINT = "https://artificialanalysis.ai/api/v2/data/llms/models";

// Only surface models from these creators. Matched case-insensitively against
// the creator slug first, then the creator name as a fallback.
//
// NOTE: the exact slugs for Moonshot/Zhipu/MiniMax/Xiaomi must be verified
// against the live response on first run (see logDistinctCreators). Each entry
// lists several known aliases so the filter is resilient to AA's naming.
export const ALLOWED_CREATORS: Record<string, string[]> = {
  OpenAI: ["openai"],
  Google: ["google", "google-deepmind", "deepmind"],
  Anthropic: ["anthropic"],
  Kimi: ["moonshot-ai", "moonshot", "kimi"],
  GLM: ["zhipu", "zhipu-ai", "z-ai", "zai", "glm"],
  MiniMax: ["minimax"],
  MiMo: ["xiaomi", "mimo"],
};

const ALL_ALLOWED = new Set(
  Object.values(ALLOWED_CREATORS).flat().map((s) => s.toLowerCase()),
);

// Safely read a number from possibly-nested, possibly-missing JSON.
function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// Try a list of candidate keys on an object and return the first numeric hit.
function firstNum(obj: Record<string, any> | undefined, keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = num(obj[k]);
    if (v !== null) return v;
  }
  return null;
}

interface RawModel {
  id?: string;
  name?: string;
  slug?: string;
  model_creator?: { id?: string; name?: string; slug?: string };
  evaluations?: Record<string, any>;
  pricing?: Record<string, any>;
  [key: string]: any;
}

export function normalize(raw: RawModel): Model {
  const creator = raw.model_creator ?? {};
  const ev = raw.evaluations ?? {};
  const pr = raw.pricing ?? {};

  return {
    id: String(raw.id ?? raw.slug ?? raw.name ?? ""),
    name: String(raw.name ?? raw.slug ?? ""),
    slug: String(raw.slug ?? ""),
    creator: String(creator.name ?? "Unknown"),
    creatorSlug: String(creator.slug ?? "").toLowerCase(),

    intelligence: num(ev.artificial_analysis_intelligence_index),
    coding: num(ev.artificial_analysis_coding_index),
    math: num(ev.artificial_analysis_math_index),

    speed: firstNum(raw, ["median_output_tokens_per_second"]),
    latency: firstNum(raw, [
      "median_time_to_first_token_seconds",
      "median_time_to_first_answer_token",
    ]),

    priceInput: firstNum(pr, ["price_1m_input_tokens"]),
    priceOutput: firstNum(pr, ["price_1m_output_tokens"]),
    priceBlended: firstNum(pr, [
      "price_1m_blended_3_to_1",
      "price_1m_blended",
    ]),

    // "Tokens used" is not documented; probe several plausible keys across the
    // model root and the evaluations object. Falls back to null if none exist.
    tokensUsed:
      firstNum(raw, [
        "median_tokens_used",
        "intelligence_index_tokens_used",
        "tokens_used",
        "evaluation_tokens_used",
      ]) ??
      firstNum(ev, [
        "tokens_used",
        "artificial_analysis_intelligence_index_tokens_used",
        "intelligence_index_tokens_used",
      ]),
  };
}

export function isAllowed(model: Model): boolean {
  if (model.creatorSlug && ALL_ALLOWED.has(model.creatorSlug)) return true;
  // Fallback: match against the human name, lowercased and de-spaced.
  const name = model.creator.toLowerCase().replace(/\s+/g, "-");
  return ALL_ALLOWED.has(name);
}

// Fetch + filter + normalize. Returns the models from the allowed creators.
export async function fetchModels(apiKey: string): Promise<Model[]> {
  const res = await fetch(AA_ENDPOINT, {
    headers: { "x-api-key": apiKey, accept: "application/json" },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AA API ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }

  const json: any = await res.json();
  const rows: RawModel[] = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : [];

  if (rows.length === 0) {
    throw new Error("AA API returned no rows (unexpected response shape)");
  }

  // Debug aid: log the distinct creator slugs once so we can pin exact values.
  logDistinctCreators(rows);

  return rows
    .map(normalize)
    .filter(isAllowed)
    .sort((a, b) => (b.intelligence ?? -1) - (a.intelligence ?? -1));
}

function logDistinctCreators(rows: RawModel[]): void {
  const slugs = new Set<string>();
  for (const r of rows) {
    const s = r.model_creator?.slug;
    if (s) slugs.add(String(s).toLowerCase());
  }
  console.log("AA distinct creator slugs:", [...slugs].sort().join(", "));
}

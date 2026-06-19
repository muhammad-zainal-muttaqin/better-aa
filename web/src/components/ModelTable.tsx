import { useState, type ReactNode } from "react";
import type { Model } from "../lib/types";
import {
  creatorColor,
  real,
  finite,
  fmtIndex,
  fmtSpeed,
  fmtLatency,
  fmtPrice,
  fmtCost,
  fmtTokens,
  fmtPct,
  fmtContext,
  fmtDate,
  modalityGlyphs,
  heatClass,
} from "../lib/theme";

type View = "overview" | "bench" | "price";

const VIEWS: { key: View; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "bench", label: "Benchmarks" },
  { key: "price", label: "Speed & Price" },
];

interface Col {
  key: string;
  label: string;
  title?: string; // header tooltip
  numeric: boolean;
  views: View[];
  // Heatmap direction: "high" = bigger is better, "low" = smaller is better.
  heat?: "high" | "low";
  // Value used for the heatmap (skips the "0 = missing" sentinel). Defaults to sortVal.
  heatVal?: (m: Model) => number | null;
  sortVal: (m: Model) => number | string | null;
  render: (m: Model) => ReactNode;
}

const ALL: View[] = ["overview", "bench", "price"];

// Driven entirely by this config — add a column by adding a row. `views` controls
// which preset tab(s) a column appears in; `heat` opts the cell into the baked
// goodness-graded background.
const COLUMNS: Col[] = [
  {
    key: "creator",
    label: "Creator",
    numeric: false,
    views: ALL,
    sortVal: (m) => m.creator,
    render: (m) => (
      <span className="chip" style={{ ["--c" as any]: creatorColor(m.creator) }}>
        <span className="ledot" />
        {m.creator}
      </span>
    ),
  },
  {
    key: "intelligence",
    label: "Intelligence",
    title: "Artificial Analysis Intelligence Index",
    numeric: true,
    views: ["overview", "bench"],
    heat: "high",
    heatVal: (m) => finite(m.intelligence),
    sortVal: (m) => m.intelligence,
    render: () => null, // special-cased (bar) in the body
  },
  { key: "gpqa", label: "GPQA", title: "GPQA Diamond — graduate science reasoning", numeric: true, views: ["bench"], heat: "high", heatVal: (m) => finite(m.gpqa), sortVal: (m) => m.gpqa, render: (m) => fmtPct(m.gpqa) },
  { key: "livecodebench", label: "LiveCodeBench", title: "Coding — LiveCodeBench", numeric: true, views: ["bench"], heat: "high", heatVal: (m) => finite(m.livecodebench), sortVal: (m) => m.livecodebench, render: (m) => fmtPct(m.livecodebench) },
  { key: "aime", label: "AIME", title: "AIME 2025 — competition math", numeric: true, views: ["bench"], heat: "high", heatVal: (m) => finite(m.aime), sortVal: (m) => m.aime, render: (m) => fmtPct(m.aime) },
  { key: "mmluPro", label: "MMLU-Pro", title: "MMLU-Pro — broad knowledge", numeric: true, views: ["bench"], heat: "high", heatVal: (m) => finite(m.mmluPro), sortVal: (m) => m.mmluPro, render: (m) => fmtPct(m.mmluPro) },
  { key: "hle", label: "HLE", title: "Humanity's Last Exam", numeric: true, views: ["bench"], heat: "high", heatVal: (m) => finite(m.hle), sortVal: (m) => m.hle, render: (m) => fmtPct(m.hle) },
  { key: "contextWindow", label: "Context", title: "Context window (tokens)", numeric: true, views: ["overview"], heat: "high", heatVal: (m) => real(m.contextWindow), sortVal: (m) => m.contextWindow, render: (m) => fmtContext(m.contextWindow) },
  {
    key: "inputModalities",
    label: "Inputs",
    title: "Input modalities",
    numeric: false,
    views: ["overview"],
    sortVal: (m) => m.inputModalities?.length ?? 0,
    render: (m) => <span className="mods">{modalityGlyphs(m.inputModalities)}</span>,
  },
  {
    key: "reasoning",
    label: "Type",
    title: "Reasoning model / open weights",
    numeric: false,
    views: ["overview"],
    sortVal: (m) => (m.reasoning ? 1 : 0),
    render: (m) => (
      <span className="tags">
        {m.reasoning ? <span className="tag reason">reasoning</span> : null}
        {m.openWeights ? <span className="tag open">open</span> : null}
        {!m.reasoning && !m.openWeights ? "—" : null}
      </span>
    ),
  },
  { key: "speed", label: "Speed", title: "Median output tokens/sec", numeric: true, views: ["overview", "price"], heat: "high", heatVal: (m) => real(m.speed), sortVal: (m) => m.speed, render: (m) => fmtSpeed(real(m.speed)) },
  { key: "latency", label: "Latency", title: "Time to first token (s) — lower is snappier", numeric: true, views: ["overview", "price"], heat: "low", heatVal: (m) => real(m.latency), sortVal: (m) => m.latency, render: (m) => fmtLatency(real(m.latency)) },
  { key: "priceInput", label: "In $/1M", title: "Input price — lower is cheaper", numeric: true, views: ["price"], heat: "low", heatVal: (m) => real(m.priceInput), sortVal: (m) => m.priceInput, render: (m) => fmtPrice(real(m.priceInput)) },
  { key: "priceOutput", label: "Out $/1M", title: "Output price — lower is cheaper", numeric: true, views: ["price"], heat: "low", heatVal: (m) => real(m.priceOutput), sortVal: (m) => m.priceOutput, render: (m) => fmtPrice(real(m.priceOutput)) },
  { key: "priceBlended", label: "Blended", title: "Blended $/1M (3:1 input:output) — lower is cheaper", numeric: true, views: ["overview", "price"], heat: "low", heatVal: (m) => real(m.priceBlended), sortVal: (m) => m.priceBlended, render: (m) => fmtPrice(real(m.priceBlended)) },
  { key: "tokensUsed", label: "Tokens used", title: "Output tokens to run the Intelligence Index — lower is more efficient", numeric: true, views: ["price"], heat: "low", heatVal: (m) => real(m.tokensUsed), sortVal: (m) => m.tokensUsed, render: (m) => fmtTokens(m.tokensUsed) },
  { key: "costToRun", label: "Cost to run", title: "USD to run the full Intelligence Index — lower is cheaper", numeric: true, views: ["price"], heat: "low", heatVal: (m) => real(m.costToRun), sortVal: (m) => m.costToRun, render: (m) => fmtCost(m.costToRun) },
  { key: "releaseDate", label: "Released", numeric: false, views: ["overview"], sortVal: (m) => m.releaseDate ?? "", render: (m) => fmtDate(m.releaseDate) },
];

// `v-overview v-bench …` for each view a column belongs to; CSS hides the rest.
function viewClasses(views: View[]): string {
  return views.map((v) => `v-${v}`).join(" ");
}

export default function ModelTable({ models }: { models: Model[] }) {
  // Kept for the SSR build render; client interactivity is handled by the
  // framework-free script in index.astro (the table is never hydrated).
  const [sortKey, setSortKey] = useState<string>("intelligence");
  const [asc, setAsc] = useState(false);
  const [query, setQuery] = useState("");

  function toggle(key: string) {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(key === "name" || key === "creator" || key === "releaseDate");
    }
  }

  const col = COLUMNS.find((c) => c.key === sortKey);
  const q = query.trim().toLowerCase();
  const visible = q
    ? models.filter(
        (m) => m.name.toLowerCase().includes(q) || m.creator.toLowerCase().includes(q),
      )
    : models;

  const sorted = [...visible].sort((a, b) => {
    const av = col ? col.sortVal(a) : (a.name as string);
    const bv = col ? col.sortVal(b) : (b.name as string);
    if (av === null || av === "") return 1;
    if (bv === null || bv === "") return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const maxInt = Math.max(1, ...models.map((m) => m.intelligence ?? 0));

  // Per-column {min,max} for the baked heatmap, computed once over all models.
  const ranges: Record<string, { min: number; max: number }> = {};
  for (const c of COLUMNS) {
    if (!c.heat) continue;
    const get = c.heatVal ?? ((m: Model) => c.sortVal(m) as number | null);
    let min = Infinity;
    let max = -Infinity;
    for (const m of models) {
      const v = get(m);
      if (v === null || !Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (Number.isFinite(min) && Number.isFinite(max)) ranges[c.key] = { min, max };
  }

  return (
    <div className="card table-card" id="model-table">
      <div className="card-head table-head">
        <div className="table-title">
          <h2>
            <span className="live-dot" aria-hidden="true" />
            All models
          </h2>
          <p className="sub">
            <span className="rowcount">{visible.length}</span> models · click a column to sort ·
            <span className="heat-legend"> cells shaded by rank — brighter is better</span>
          </p>
        </div>
        <div className="table-controls">
          <div className="tabbar" role="tablist" aria-label="Column views">
            {VIEWS.map((v, i) => (
              <button
                key={v.key}
                className={`tab${i === 0 ? " active" : ""}`}
                data-view={v.key}
                role="tab"
                aria-selected={i === 0}
              >
                {v.label}
              </button>
            ))}
          </div>
          <input
            className="search"
            type="search"
            placeholder="Filter models…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter models by name or creator"
          />
          {/* Release-date range. Inert with JS off (all rows show); the vanilla
              script in index.astro wires filtering + the relative presets. */}
          <div className="date-filter">
            <span className="df-label">Released</span>
            <input className="date-from" type="date" aria-label="Released on or after" />
            <span className="df-sep">→</span>
            <input className="date-to" type="date" aria-label="Released on or before" />
            <div className="df-presets" role="group" aria-label="Quick date ranges">
              <button type="button" className="df-chip" data-months="6">6mo</button>
              <button type="button" className="df-chip" data-months="12">1y</button>
              <button type="button" className="df-chip" data-months="24">2y</button>
              <button type="button" className="df-chip" data-months="0">All</button>
            </div>
          </div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="view-overview">
          <thead>
            <tr>
              <th className="rankcol col v-overview v-bench v-price">#</th>
              <th
                className="stickycol col v-overview v-bench v-price"
                data-key="name"
                onClick={() => toggle("name")}
                aria-sort={sortKey === "name" ? (asc ? "ascending" : "descending") : "none"}
              >
                Model
                <span className="sortcaret">{sortKey === "name" ? (asc ? " ↑" : " ↓") : ""}</span>
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`col ${viewClasses(c.views)}${c.numeric ? " num" : ""}`}
                  data-key={c.key}
                  data-numeric={c.numeric ? "1" : "0"}
                  title={c.title}
                  onClick={() => toggle(c.key)}
                  aria-sort={sortKey === c.key ? (asc ? "ascending" : "descending") : "none"}
                >
                  {c.label}
                  <span className="sortcaret">{sortKey === c.key ? (asc ? " ↑" : " ↓") : ""}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr
                key={m.id}
                data-id={m.id}
                data-creator={m.creator}
                data-name={m.name}
                data-released={m.releaseDate ?? ""}
              >
                <td className="rankcol col v-overview v-bench v-price">{i + 1}</td>
                <td className="model-cell stickycol col v-overview v-bench v-price">{m.name}</td>
                {COLUMNS.map((c) => {
                  // Baked heatmap as a shared class (.h0–.h10) instead of a unique
                  // inline style — travels with the row when the vanilla sorter
                  // reorders <tr>s, at a fraction of the HTML/recalc cost.
                  let heat = "";
                  if (c.heat && ranges[c.key]) {
                    const get = c.heatVal ?? ((mm: Model) => c.sortVal(mm) as number | null);
                    heat = heatClass(get(m), ranges[c.key].min, ranges[c.key].max, c.heat === "low");
                  }
                  const cls = `col ${viewClasses(c.views)}${c.numeric ? " num" : ""}${heat ? " " + heat : ""}`;
                  if (c.key === "intelligence") {
                    return (
                      <td key={c.key} className={cls}>
                        {m.intelligence === null ? (
                          "—"
                        ) : (
                          <span className="intel-cell">
                            <span className="intel-bar">
                              <span
                                className="intel-fill"
                                style={{
                                  width: `${(m.intelligence / maxInt) * 100}%`,
                                  background: creatorColor(m.creator),
                                }}
                              />
                            </span>
                            <span className="intel-num">{fmtIndex(m.intelligence)}</span>
                          </span>
                        )}
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className={cls}>
                      {c.render(m)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="empty">No models match “{query}”.</p>}
      </div>
    </div>
  );
}

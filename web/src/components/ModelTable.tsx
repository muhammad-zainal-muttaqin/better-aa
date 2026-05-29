import { useState, type ReactNode } from "react";
import type { Model } from "../lib/types";
import {
  creatorColor,
  real,
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
} from "../lib/theme";

interface Col {
  key: string;
  label: string;
  title?: string; // header tooltip
  numeric: boolean;
  sortVal: (m: Model) => number | string | null;
  render: (m: Model) => ReactNode;
}

// Driven entirely by this config — add a column by adding a row.
const COLUMNS: Col[] = [
  {
    key: "creator",
    label: "Creator",
    numeric: false,
    sortVal: (m) => m.creator,
    render: (m) => (
      <span className="chip" style={{ ["--c" as any]: creatorColor(m.creator) }}>
        <span className="ledot" style={{ ["--c" as any]: creatorColor(m.creator) }} />
        {m.creator}
      </span>
    ),
  },
  {
    key: "intelligence",
    label: "Intelligence",
    title: "Artificial Analysis Intelligence Index",
    numeric: true,
    sortVal: (m) => m.intelligence,
    render: () => null, // special-cased (bar) in the body
  },
  { key: "gpqa", label: "GPQA", title: "GPQA Diamond — graduate science reasoning", numeric: true, sortVal: (m) => m.gpqa, render: (m) => fmtPct(m.gpqa) },
  { key: "livecodebench", label: "LiveCodeBench", title: "Coding — LiveCodeBench", numeric: true, sortVal: (m) => m.livecodebench, render: (m) => fmtPct(m.livecodebench) },
  { key: "aime", label: "AIME", title: "AIME 2025 — competition math", numeric: true, sortVal: (m) => m.aime, render: (m) => fmtPct(m.aime) },
  { key: "mmluPro", label: "MMLU-Pro", title: "MMLU-Pro — broad knowledge", numeric: true, sortVal: (m) => m.mmluPro, render: (m) => fmtPct(m.mmluPro) },
  { key: "hle", label: "HLE", title: "Humanity's Last Exam", numeric: true, sortVal: (m) => m.hle, render: (m) => fmtPct(m.hle) },
  { key: "contextWindow", label: "Context", title: "Context window (tokens)", numeric: true, sortVal: (m) => m.contextWindow, render: (m) => fmtContext(m.contextWindow) },
  {
    key: "inputModalities",
    label: "Inputs",
    title: "Input modalities",
    numeric: false,
    sortVal: (m) => m.inputModalities?.length ?? 0,
    render: (m) => <span className="mods">{modalityGlyphs(m.inputModalities)}</span>,
  },
  {
    key: "reasoning",
    label: "Type",
    title: "Reasoning model / open weights",
    numeric: false,
    sortVal: (m) => (m.reasoning ? 1 : 0),
    render: (m) => (
      <span className="tags">
        {m.reasoning ? <span className="tag reason">reasoning</span> : null}
        {m.openWeights ? <span className="tag open">open</span> : null}
        {!m.reasoning && !m.openWeights ? "—" : null}
      </span>
    ),
  },
  { key: "speed", label: "Speed", title: "Median output tokens/sec", numeric: true, sortVal: (m) => m.speed, render: (m) => fmtSpeed(real(m.speed)) },
  { key: "latency", label: "Latency", title: "Time to first token (s)", numeric: true, sortVal: (m) => m.latency, render: (m) => fmtLatency(real(m.latency)) },
  { key: "priceInput", label: "In $/1M", numeric: true, sortVal: (m) => m.priceInput, render: (m) => fmtPrice(real(m.priceInput)) },
  { key: "priceOutput", label: "Out $/1M", numeric: true, sortVal: (m) => m.priceOutput, render: (m) => fmtPrice(real(m.priceOutput)) },
  { key: "priceBlended", label: "Blended", title: "Blended $/1M (3:1 input:output)", numeric: true, sortVal: (m) => m.priceBlended, render: (m) => fmtPrice(real(m.priceBlended)) },
  { key: "tokensUsed", label: "Tokens used", title: "Output tokens to run the Intelligence Index", numeric: true, sortVal: (m) => m.tokensUsed, render: (m) => fmtTokens(m.tokensUsed) },
  { key: "costToRun", label: "Cost to run", title: "USD to run the full Intelligence Index", numeric: true, sortVal: (m) => m.costToRun, render: (m) => fmtCost(m.costToRun) },
  { key: "releaseDate", label: "Released", numeric: false, sortVal: (m) => m.releaseDate ?? "", render: (m) => fmtDate(m.releaseDate) },
];

export default function ModelTable({ models }: { models: Model[] }) {
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

  return (
    <div className="card" id="model-table">
      <div className="card-head table-head">
        <div>
          <h2>All models</h2>
          <p className="sub">
            <span className="rowcount">{visible.length}</span> models · {COLUMNS.length + 1} metrics
            · click a column to sort, scroll for more →
          </p>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Filter models…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter models by name or creator"
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="rankcol">#</th>
              <th
                className="stickycol"
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
                  className={c.numeric ? "num" : ""}
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
              <tr key={m.id} data-id={m.id} data-creator={m.creator} data-name={m.name}>
                <td className="rankcol">{i + 1}</td>
                <td className="model-cell stickycol">{m.name}</td>
                {COLUMNS.map((c) => {
                  if (c.key === "intelligence") {
                    return (
                      <td key={c.key} className="num">
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
                    <td key={c.key} className={c.numeric ? "num" : ""}>
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

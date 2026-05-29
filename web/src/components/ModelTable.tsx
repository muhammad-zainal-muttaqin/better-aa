import { useState } from "react";
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
} from "../lib/theme";

type SortKey =
  | "name"
  | "creator"
  | "intelligence"
  | "speed"
  | "latency"
  | "priceInput"
  | "priceOutput"
  | "priceBlended"
  | "tokensUsed"
  | "costToRun";

interface Col {
  key: SortKey;
  label: string;
  numeric: boolean;
}

const COLUMNS: Col[] = [
  { key: "name", label: "Model", numeric: false },
  { key: "creator", label: "Creator", numeric: false },
  { key: "intelligence", label: "Intelligence", numeric: true },
  { key: "speed", label: "Speed", numeric: true },
  { key: "latency", label: "Latency", numeric: true },
  { key: "priceInput", label: "In $/1M", numeric: true },
  { key: "priceOutput", label: "Out $/1M", numeric: true },
  { key: "priceBlended", label: "Blended", numeric: true },
  { key: "tokensUsed", label: "Tokens used", numeric: true },
  { key: "costToRun", label: "Cost to run", numeric: true },
];

export default function ModelTable({ models }: { models: Model[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("intelligence");
  const [asc, setAsc] = useState(false);
  const [query, setQuery] = useState("");

  function toggle(key: SortKey) {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(key === "name" || key === "creator");
    }
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? models.filter(
        (m) => m.name.toLowerCase().includes(q) || m.creator.toLowerCase().includes(q),
      )
    : models;

  const sorted = [...visible].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const maxInt = Math.max(1, ...models.map((m) => m.intelligence ?? 0));

  return (
    <div className="card">
      <div className="card-head table-head">
        <div>
          <h2>All models</h2>
          <p className="sub">{visible.length} models · click a column to sort.</p>
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
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={c.numeric ? "num" : ""}
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
              <tr key={m.id}>
                <td className="rankcol">{i + 1}</td>
                <td className="model-cell">{m.name}</td>
                <td>
                  <span className="chip" style={{ ["--c" as any]: creatorColor(m.creator) }}>
                    <span className="ledot" style={{ ["--c" as any]: creatorColor(m.creator) }} />
                    {m.creator}
                  </span>
                </td>
                <td className="num">
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
                <td className="num">{fmtSpeed(real(m.speed))}</td>
                <td className="num">{fmtLatency(real(m.latency))}</td>
                <td className="num">{fmtPrice(real(m.priceInput))}</td>
                <td className="num">{fmtPrice(real(m.priceOutput))}</td>
                <td className="num">{fmtPrice(real(m.priceBlended))}</td>
                <td className="num">{fmtTokens(m.tokensUsed)}</td>
                <td className="num">{fmtCost(m.costToRun)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="empty">No models match “{query}”.</p>}
      </div>
    </div>
  );
}

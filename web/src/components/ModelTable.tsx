import { useState } from "react";
import type { Model } from "../lib/types";
import {
  creatorColor,
  fmtIndex,
  fmtSpeed,
  fmtLatency,
  fmtPrice,
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
  | "tokensUsed";

interface Col {
  key: SortKey;
  label: string;
  numeric: boolean;
  render: (m: Model) => string;
}

const COLUMNS: Col[] = [
  { key: "name", label: "Model", numeric: false, render: (m) => m.name },
  { key: "creator", label: "Creator", numeric: false, render: (m) => m.creator },
  { key: "intelligence", label: "Intelligence", numeric: true, render: (m) => fmtIndex(m.intelligence) },
  { key: "speed", label: "Speed", numeric: true, render: (m) => fmtSpeed(m.speed) },
  { key: "latency", label: "Latency", numeric: true, render: (m) => fmtLatency(m.latency) },
  { key: "priceInput", label: "In $/1M", numeric: true, render: (m) => fmtPrice(m.priceInput) },
  { key: "priceOutput", label: "Out $/1M", numeric: true, render: (m) => fmtPrice(m.priceOutput) },
  { key: "priceBlended", label: "Blended $/1M", numeric: true, render: (m) => fmtPrice(m.priceBlended) },
  { key: "tokensUsed", label: "Tokens used", numeric: true, render: (m) => fmtTokens(m.tokensUsed) },
];

export default function ModelTable({ models }: { models: Model[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("intelligence");
  const [asc, setAsc] = useState(false);

  function toggle(key: SortKey) {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      // Names sort A→Z by default; numbers high→low.
      setAsc(key === "name" || key === "creator");
    }
  }

  const sorted = [...models].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null) return 1;
    if (bv === null) return -1;
    if (typeof av === "string" && typeof bv === "string") {
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  return (
    <div className="card">
      <h2>All models</h2>
      <p className="sub">Click a column header to sort.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={c.numeric ? "num" : ""}
                  onClick={() => toggle(c.key)}
                  aria-sort={sortKey === c.key ? (asc ? "ascending" : "descending") : "none"}
                >
                  {c.label}
                  {sortKey === c.key ? (asc ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.id}>
                {COLUMNS.map((c) => (
                  <td key={c.key} className={c.numeric ? "num" : ""}>
                    {c.key === "creator" ? (
                      <span className="chip" style={{ ["--c" as any]: creatorColor(m.creator) }}>
                        {m.creator}
                      </span>
                    ) : (
                      c.render(m)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

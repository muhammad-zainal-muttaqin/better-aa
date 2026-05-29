import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
} from "recharts";
import type { Model } from "../lib/types";
import { creatorColor, real, finite, fmtPrice, fmtIndex } from "../lib/theme";

// Models priced at "0" in the snapshot are really "unknown" — drop them so the
// log scale stays finite and the quadrant reads honestly.
type Pt = Model & { x: number; y: number };

function points(models: Model[]): Pt[] {
  const out: Pt[] = [];
  for (const m of models) {
    const x = real(m.priceBlended);
    const y = finite(m.intelligence);
    if (x === null || y === null) continue;
    out.push({ ...m, x, y });
  }
  return out;
}

// The efficiency frontier: walking from cheapest to priciest, keep every model
// that sets a new intelligence high. Nothing is both smarter AND cheaper than a
// frontier point — these are the only rational picks. This is the chart's spine.
function frontier(pts: Pt[]): Pt[] {
  const byPrice = [...pts].sort((a, b) => a.x - b.x);
  const front: Pt[] = [];
  let best = -Infinity;
  for (const p of byPrice) {
    if (p.y > best) {
      front.push(p);
      best = p.y;
    }
  }
  return front;
}

// Short label for frontier points (drop the parenthetical effort suffixes).
function shortName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

export default function IntelligencePriceChart({ models }: { models: Model[] }) {
  const pts = points(models);
  const byCreator = new Map<string, Pt[]>();
  for (const p of pts) {
    const arr = byCreator.get(p.creator) ?? [];
    arr.push(p);
    byCreator.set(p.creator, arr);
  }
  const front = frontier(pts);
  const frontIds = new Set(front.map((p) => p.id));

  if (pts.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <h2>Intelligence vs. Price</h2>
          <p className="sub">Higher and further left is the sweet spot — smart and cheap.</p>
        </div>
        <p className="empty">No priced models in the current selection.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>Intelligence vs. Price</h2>
        <p className="sub">
          Higher and further left is the sweet spot. The line traces the efficiency
          frontier — models nothing else beats on both smarts and cost.
        </p>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 16, right: 28, bottom: 30, left: 6 }}>
          <defs>
            <linearGradient id="frontierStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="x"
            name="Price"
            scale="log"
            domain={["auto", "auto"]}
            tick={{ fill: "#8a8a93", fontSize: 11 }}
            tickFormatter={(v) => fmtPrice(v)}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            label={{
              value: "Blended price  ·  $/1M tokens (log)",
              position: "bottom",
              fill: "#5c5c64",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Intelligence"
            domain={["auto", "auto"]}
            tick={{ fill: "#8a8a93", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
            label={{
              value: "Intelligence Index",
              angle: -90,
              position: "insideLeft",
              fill: "#5c5c64",
              fontSize: 11,
              style: { textAnchor: "middle" },
            }}
          />
          <ZAxis range={[42, 42]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.18)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const m = payload[0].payload as Pt;
              return (
                <div className="tooltip">
                  <strong>{m.name}</strong>
                  <div className="tt-creator">
                    <span className="ledot" style={{ ["--c" as any]: creatorColor(m.creator) }} />
                    {m.creator}
                    {frontIds.has(m.id) && <span className="tt-tag">frontier</span>}
                  </div>
                  <div className="tt-row">
                    <span>Intelligence</span>
                    <b>{fmtIndex(m.y)}</b>
                  </div>
                  <div className="tt-row">
                    <span>Blended</span>
                    <b>{fmtPrice(m.x)}/1M</b>
                  </div>
                </div>
              );
            }}
          />

          {/* All models, colored by creator. Frontier members render on top. */}
          {[...byCreator.entries()].map(([creator, data]) => (
            <Scatter
              key={creator}
              name={creator}
              data={data.filter((d) => !frontIds.has(d.id))}
              fill={creatorColor(creator)}
              fillOpacity={0.5}
            />
          ))}

          {/* The efficiency frontier — connected line + labeled leaders. */}
          <Scatter
            name="Efficiency frontier"
            data={front}
            line={{ stroke: "url(#frontierStroke)", strokeWidth: 1.5 }}
            lineType="joint"
            shape="circle"
          >
            {front.map((p) => (
              <Cell
                key={p.id}
                fill={creatorColor(p.creator)}
                stroke="#0b0b0d"
                strokeWidth={1.5}
              />
            ))}
            <LabelList
              dataKey="name"
              position="top"
              offset={9}
              content={(props: any) => {
                const { x, y, value } = props;
                if (x == null || y == null) return null;
                return (
                  <text
                    x={x}
                    y={y - 9}
                    fill="#d7d7dc"
                    fontSize={10.5}
                    textAnchor="middle"
                    style={{ fontWeight: 500, paintOrder: "stroke", stroke: "#0b0b0d", strokeWidth: 3 }}
                  >
                    {shortName(String(value))}
                  </text>
                );
              }}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

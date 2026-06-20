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

  // Sparse log-spaced ticks (1 and 3 per decade) so the price axis labels never
  // overlap across a range that spans cents to hundreds of dollars per 1M tokens.
  const xs = pts.map((p) => p.x);
  const xMin = xs.length ? Math.min(...xs) : 0.01;
  const xMax = xs.length ? Math.max(...xs) : 1;
  const priceTicks: number[] = [];
  for (let e = Math.floor(Math.log10(xMin)); e <= Math.ceil(Math.log10(xMax)); e++) {
    for (const m of [1, 3]) {
      const v = m * Math.pow(10, e);
      if (v >= xMin * 0.96 && v <= xMax * 1.04) priceTicks.push(v);
    }
  }

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
      <ResponsiveContainer width="100%" height={520}>
        <ScatterChart margin={{ top: 32, right: 32, bottom: 36, left: 8 }}>
          <defs>
            <linearGradient id="frontierStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#36d8c2" stopOpacity={1} />
              <stop offset="60%" stopColor="#36d8c2" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.3} />
            </linearGradient>
            <filter id="dotGlow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 8" />
          <XAxis
            type="number"
            dataKey="x"
            name="Price"
            scale="log"
            domain={["auto", "auto"]}
            ticks={priceTicks}
            tick={{ fill: "#8a8c94", fontSize: 11 }}
            tickFormatter={(v) => fmtPrice(v)}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
            label={{
              value: "Blended price  ·  $/1M tokens (log)",
              position: "bottom",
              fill: "#8a8c94",
              fontSize: 11,
              offset: 10,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Intelligence"
            domain={["auto", "auto"]}
            tick={{ fill: "#8a8c94", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            padding={{ top: 24 }}
            label={{
              value: "Intelligence Index",
              angle: -90,
              position: "insideLeft",
              fill: "#8a8c94",
              fontSize: 11,
              style: { textAnchor: "middle" },
            }}
          />
          <ZAxis range={[38, 80]} />
          <Tooltip
            cursor={{ strokeDasharray: "4 6", stroke: "rgba(255,255,255,0.12)" }}
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
              fillOpacity={0.45}
              isAnimationActive={false}
            />
          ))}

          {/* The efficiency frontier — connected line + labeled leaders. */}
          <Scatter
            name="Efficiency frontier"
            data={front}
            line={{ stroke: "url(#frontierStroke)", strokeWidth: 2.5 }}
            lineType="joint"
            shape="circle"
            isAnimationActive={false}
          >
            {front.map((p) => (
              <Cell
                key={p.id}
                fill={creatorColor(p.creator)}
                stroke="#06070a"
                strokeWidth={2}
                filter="url(#dotGlow)"
              />
            ))}
            <LabelList
              dataKey="name"
              position="top"
              offset={12}
              content={(props: any) => {
                const { x, y, value } = props;
                if (x == null || y == null) return null;
                return (
                  <text
                    x={x}
                    y={y - 12}
                    fill="#d7d8de"
                    fontSize={10.5}
                    textAnchor="middle"
                    style={{ fontWeight: 500, paintOrder: "stroke", stroke: "#06070a", strokeWidth: 4 }}
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

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Model } from "../lib/types";
import { creatorColor, fmtPrice, fmtIndex } from "../lib/theme";

// Signature "most attractive quadrant" view: cheaper + smarter = top-left.
export default function IntelligencePriceChart({ models }: { models: Model[] }) {
  const byCreator = new Map<string, Model[]>();
  for (const m of models) {
    if (m.intelligence === null || m.priceBlended === null) continue;
    const arr = byCreator.get(m.creator) ?? [];
    arr.push(m);
    byCreator.set(m.creator, arr);
  }

  return (
    <div className="card">
      <h2>Intelligence vs. Price</h2>
      <p className="sub">Higher and further left is better — smart and cheap.</p>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="priceBlended"
            name="Price"
            scale="log"
            domain={["auto", "auto"]}
            tick={{ fill: "#8a8a93", fontSize: 12 }}
            tickFormatter={(v) => fmtPrice(v)}
            label={{ value: "Blended $/1M (log)", position: "bottom", fill: "#5c5c64", fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="intelligence"
            name="Intelligence"
            tick={{ fill: "#8a8a93", fontSize: 12 }}
            label={{ value: "Intelligence", angle: -90, position: "insideLeft", fill: "#5c5c64", fontSize: 12 }}
          />
          <ZAxis range={[70, 70]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const m = payload[0].payload as Model;
              return (
                <div className="tooltip">
                  <strong>{m.name}</strong>
                  <div>{m.creator}</div>
                  <div>Intelligence: {fmtIndex(m.intelligence)}</div>
                  <div>Blended: {fmtPrice(m.priceBlended)}/1M</div>
                </div>
              );
            }}
          />
          {[...byCreator.entries()].map(([creator, data]) => (
            <Scatter key={creator} name={creator} data={data} fill={creatorColor(creator)} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import type { Model } from "../lib/types";
import { creatorColor, real } from "../lib/theme";

interface Props {
  title: string;
  subtitle: string;
  models: Model[];
  metric: keyof Model;
  format: (v: number | null) => string;
  // Sort ascending (e.g. price: cheapest first) instead of descending.
  ascending?: boolean;
  topN?: number;
}

// Pull the model's display short-name (drop parenthetical effort suffixes).
function shortName(name: string): string {
  const base = name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  return base.length > 26 ? base.slice(0, 25) + "…" : base;
}

// Generic horizontal ranked bar used for Speed, Price, Latency and Tokens.
// A snapshot "0" means the value is missing, so it's filtered out — that keeps
// "cheapest" / "snappiest" honest instead of surfacing zero-width phantom bars.
export default function RankedBarChart({
  title,
  subtitle,
  models,
  metric,
  format,
  ascending = false,
  topN = 10,
}: Props) {
  const data = models
    .map((m) => ({ ...m, _v: real(m[metric] as number | null) }))
    .filter((m) => m._v !== null)
    .sort((a, b) => (ascending ? a._v! - b._v! : b._v! - a._v!))
    .slice(0, topN)
    .map((m) => ({ ...m, label: shortName(m.name) }));

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <h2>{title}</h2>
          <p className="sub">{subtitle}</p>
        </div>
        <p className="empty">Not provided by the Artificial Analysis API.</p>
      </div>
    );
  }

  const maxV = Math.max(...data.map((d) => d._v!));

  return (
    <div className="card">
      <div className="card-head">
        <h2>{title}</h2>
        <p className="sub">{subtitle}</p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(210, data.length * 32)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 54, bottom: 2, left: 4 }}
          barCategoryGap="22%"
        >
          <XAxis type="number" domain={[0, maxV * 1.08]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={148}
            tick={{ fill: "#c9c9d0", fontSize: 11.5 }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.035)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const m = payload[0].payload as Model & { _v: number };
              return (
                <div className="tooltip">
                  <strong>{m.name}</strong>
                  <div className="tt-creator">
                    <span className="ledot" style={{ ["--c" as any]: creatorColor(m.creator) }} />
                    {m.creator}
                  </div>
                  <div className="tt-row">
                    <span>{title}</span>
                    <b>{format(m._v)}</b>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="_v" radius={[0, 5, 5, 0]} isAnimationActive={false} maxBarSize={20}>
            {data.map((m) => (
              <Cell key={m.id} fill={creatorColor(m.creator)} fillOpacity={0.85} />
            ))}
            <LabelList
              dataKey="_v"
              position="right"
              offset={8}
              formatter={(v: number) => format(v)}
              fill="#9aa0aa"
              fontSize={11}
              style={{ fontFamily: "var(--mono)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

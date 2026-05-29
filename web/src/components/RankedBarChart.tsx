import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import type { Model } from "../lib/types";
import { creatorColor } from "../lib/theme";

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

// Generic horizontal ranked bar used for Speed, Price and Tokens.
export default function RankedBarChart({
  title,
  subtitle,
  models,
  metric,
  format,
  ascending = false,
  topN = 12,
}: Props) {
  const data = models
    .filter((m) => typeof m[metric] === "number")
    .sort((a, b) => {
      const av = a[metric] as number;
      const bv = b[metric] as number;
      return ascending ? av - bv : bv - av;
    })
    .slice(0, topN);

  if (data.length === 0) {
    return (
      <div className="card">
        <h2>{title}</h2>
        <p className="sub">{subtitle}</p>
        <p className="empty">Not provided by the Artificial Analysis API.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="sub">{subtitle}</p>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 30)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#8a8a93", fontSize: 12 }} tickFormatter={(v) => format(v)} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: "#c9c9d0", fontSize: 12 }}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const m = payload[0].payload as Model;
              return (
                <div className="tooltip">
                  <strong>{m.name}</strong>
                  <div>{m.creator}</div>
                  <div>{format(m[metric] as number)}</div>
                </div>
              );
            }}
          />
          <Bar dataKey={metric as string} radius={[0, 4, 4, 0]}>
            {data.map((m) => (
              <Cell key={m.id} fill={creatorColor(m.creator)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

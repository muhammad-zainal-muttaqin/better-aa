import type { Model } from "../lib/types";
import { creatorColor, fmtIndex, fmtSpeed, fmtPrice, fmtLatency } from "../lib/theme";

interface Stat {
  label: string;
  model: Model | null;
  value: string;
  metric: keyof Model;
  mode: "max" | "min";
  fmt: "index" | "speed" | "price" | "latency";
}

function pick(
  models: Model[],
  metric: keyof Model,
  mode: "max" | "min",
): Model | null {
  const pool = models.filter((m) => typeof m[metric] === "number" && (m[metric] as number) > 0);
  if (pool.length === 0) return null;
  return pool.reduce((best, m) =>
    mode === "max"
      ? (m[metric] as number) > (best[metric] as number)
        ? m
        : best
      : (m[metric] as number) < (best[metric] as number)
        ? m
        : best,
  );
}

// Headline KPI tiles — the "what's best right now" answer, derived from data.
export default function StatStrip({ models }: { models: Model[] }) {
  const smartest = pick(models, "intelligence", "max");
  const fastest = pick(models, "speed", "max");
  const cheapest = pick(models, "priceBlended", "min");
  const snappiest = pick(models, "latency", "min");

  const stats: Stat[] = [
    { label: "Most intelligent", model: smartest, value: fmtIndex(smartest?.intelligence ?? null), metric: "intelligence", mode: "max", fmt: "index" },
    { label: "Fastest output", model: fastest, value: fmtSpeed(fastest?.speed ?? null), metric: "speed", mode: "max", fmt: "speed" },
    { label: "Cheapest blended", model: cheapest, value: fmtPrice(cheapest?.priceBlended ?? null), metric: "priceBlended", mode: "min", fmt: "price" },
    { label: "Lowest latency", model: snappiest, value: fmtLatency(snappiest?.latency ?? null), metric: "latency", mode: "min", fmt: "latency" },
  ];

  return (
    <section className="kpi-strip" aria-label="Highlights">
      {stats.map((s, i) => (
        <article
          className="kpi"
          key={s.label}
          data-metric={s.metric}
          data-mode={s.mode}
          data-fmt={s.fmt}
          style={{
            ["--i" as any]: i,
            ["--c" as any]: s.model ? creatorColor(s.model.creator) : "var(--accent)",
          }}
        >
          <span className="kpi-label">{s.label}</span>
          <span className="kpi-value">{s.value}</span>
          {s.model && (
            <span className="kpi-model">
              <span className="ledot" style={{ ["--c" as any]: creatorColor(s.model.creator) }} />
              {s.model.name}
            </span>
          )}
        </article>
      ))}
    </section>
  );
}

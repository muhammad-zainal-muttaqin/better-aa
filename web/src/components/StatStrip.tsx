import type { Model } from "../lib/types";
import { creatorColor, fmtIndex, fmtSpeed, fmtPrice, fmtLatency } from "../lib/theme";

interface Stat {
  label: string;
  model: Model | null;
  value: string;
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
    { label: "Most intelligent", model: smartest, value: fmtIndex(smartest?.intelligence ?? null) },
    { label: "Fastest output", model: fastest, value: fmtSpeed(fastest?.speed ?? null) },
    { label: "Cheapest blended", model: cheapest, value: fmtPrice(cheapest?.priceBlended ?? null) },
    { label: "Lowest latency", model: snappiest, value: fmtLatency(snappiest?.latency ?? null) },
  ];

  return (
    <section className="kpi-strip" aria-label="Highlights">
      {stats.map((s, i) => (
        <article className="kpi" key={s.label} style={{ ["--i" as any]: i }}>
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

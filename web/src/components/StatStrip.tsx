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
    <section className="kpi-strip-wrap" aria-label="Highlights">
      <div className="strip-head">
        <h2>Leaders right now</h2>
        <p className="sub">
          The current best model on each axis, recomputed live as you filter by provider or release date.
        </p>
      </div>
      <div className="kpi-strip">
        {stats.map((s, i) => (
          <div className="kpi-outer" key={s.label} style={{ ["--i" as any]: i }}>
            <article
              className="kpi"
              data-metric={s.metric}
              data-mode={s.mode}
              data-fmt={s.fmt}
              style={{
                ["--c" as any]: s.model ? creatorColor(s.model.creator) : "var(--accent)",
              }}
            >
              <div className="kpi-top">
                <span className="kpi-label">{s.label}</span>
                <span className="kpi-badge">#1</span>
              </div>
              <span className="kpi-value">{s.value}</span>
              {s.model && (
                <span className="kpi-model">
                  <span className="ledot" style={{ ["--c" as any]: creatorColor(s.model.creator) }} />
                  <span className="kpi-model-name" title={s.model.name}>{s.model.name}</span>
                </span>
              )}
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}

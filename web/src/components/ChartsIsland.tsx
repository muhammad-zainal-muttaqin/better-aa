import { useEffect, useMemo, useState } from "react";
import type { Model } from "../lib/types";
import { CREATOR_COLORS, fmtPrice, fmtSpeed, fmtLatency, fmtTokens } from "../lib/theme";
import IntelligencePriceChart from "./IntelligencePriceChart";
import RankedBarChart from "./RankedBarChart";

// Charts are a progressive enhancement: the StatStrip + ModelTable are rendered
// as static HTML by Astro and are always visible. This island only owns the
// (non-critical) Recharts visuals + their creator legend, fed by build-time
// props — no fetch. If it ever fails to hydrate, the data below is unaffected.
export default function ChartsIsland({ models }: { models: Model[] }) {
  const creators = useMemo(
    () => [...new Set(models.map((m) => m.creator))].sort(),
    [models],
  );
  const [active, setActive] = useState<Set<string>>(() => new Set(creators));

  // Release-date window, kept in sync with the table's date filter. The vanilla
  // script in index.astro owns the controls and broadcasts the range; charts
  // subscribe so a date selection reshapes the visuals too.
  const [range, setRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  useEffect(() => {
    function onRange(e: Event) {
      const d = (e as CustomEvent<{ from: string; to: string }>).detail;
      if (d) setRange({ from: d.from || "", to: d.to || "" });
    }
    window.addEventListener("betteraa:daterange", onRange as EventListener);
    return () => window.removeEventListener("betteraa:daterange", onRange as EventListener);
  }, []);

  const filtered = useMemo(() => {
    const hasRange = range.from || range.to;
    return models.filter((m) => {
      if (!active.has(m.creator)) return false;
      if (hasRange) {
        const d = (m.releaseDate ?? "").slice(0, 10);
        if (!d) return false;
        if (range.from && d < range.from) return false;
        if (range.to && d > range.to) return false;
      }
      return true;
    });
  }, [models, active, range]);

  function toggleCreator(c: string) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  return (
    <>
      <div className="toolbar">
        <div className="legend">
          {creators.map((c) => (
            <button
              key={c}
              className={`chip toggle ${active.has(c) ? "on" : "off"}`}
              style={{ ["--c" as any]: CREATOR_COLORS[c] ?? "#8a8a93" }}
              onClick={() => toggleCreator(c)}
              aria-pressed={active.has(c)}
            >
              <span className="ledot" style={{ ["--c" as any]: CREATOR_COLORS[c] ?? "#8a8a93" }} />
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="hero-chart" style={{ ["--i" as any]: 0 }}>
        <IntelligencePriceChart models={filtered} />
      </div>

      <div className="bento">
        <div style={{ ["--i" as any]: 1 }}>
          <RankedBarChart
            title="Speed"
            subtitle="Output tokens per second — higher is faster."
            models={filtered}
            metric="speed"
            format={fmtSpeed}
          />
        </div>
        <div style={{ ["--i" as any]: 2 }}>
          <RankedBarChart
            title="Price"
            subtitle="Blended $/1M tokens (3:1) — lower is cheaper."
            models={filtered}
            metric="priceBlended"
            format={fmtPrice}
            ascending
          />
        </div>
        <div style={{ ["--i" as any]: 3 }}>
          <RankedBarChart
            title="Latency"
            subtitle="Time to first token (s) — lower is snappier."
            models={filtered}
            metric="latency"
            format={fmtLatency}
            ascending
          />
        </div>
        <div style={{ ["--i" as any]: 4 }}>
          <RankedBarChart
            title="Tokens used"
            subtitle="Output tokens to run the Intelligence Index."
            models={filtered}
            metric="tokensUsed"
            format={fmtTokens}
          />
        </div>
      </div>
    </>
  );
}

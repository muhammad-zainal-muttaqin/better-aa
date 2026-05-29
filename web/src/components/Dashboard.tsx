import { useEffect, useMemo, useState } from "react";
import type { Model, Snapshot } from "../lib/types";
import { CREATOR_COLORS, fmtPrice, fmtSpeed, fmtLatency, fmtTokens } from "../lib/theme";
import IntelligencePriceChart from "./IntelligencePriceChart";
import RankedBarChart from "./RankedBarChart";
import ModelTable from "./ModelTable";
import StatStrip from "./StatStrip";
import Skeleton from "./Skeleton";

const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "http://localhost:8787";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [active, setActive] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    // Try the live Worker (5s cap); if it's unreachable — common with browser
    // localhost cross-port blocking, or before deploy — fall back to the
    // same-origin bundled snapshot so the page always renders.
    async function fetchWithTimeout(url: string, ms: number): Promise<Snapshot> {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error ?? `HTTP ${r.status}`);
        return (await r.json()) as Snapshot;
      } finally {
        clearTimeout(timer);
      }
    }

    (async () => {
      let data: Snapshot | null = null;
      let usedFallback = false;
      try {
        data = await fetchWithTimeout(`${API_BASE}/api/models`, 5000);
      } catch {
        try {
          data = await fetchWithTimeout("/snapshot.json", 5000);
          usedFallback = true;
        } catch (e2: any) {
          if (!cancelled) setError(String(e2?.message ?? e2));
        }
      }
      if (cancelled || !data) {
        if (!cancelled) setLoading(false);
        return;
      }
      setSnapshot(data);
      setStale(usedFallback);
      setActive(new Set(data.models.map((m) => m.creator)));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const creators = useMemo(
    () => [...new Set(snapshot?.models.map((m) => m.creator) ?? [])].sort(),
    [snapshot],
  );

  const filtered: Model[] = useMemo(
    () => (snapshot?.models ?? []).filter((m) => active.has(m.creator)),
    [snapshot, active],
  );

  function toggleCreator(c: string) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  if (loading) return <Skeleton />;
  if (error)
    return (
      <div className="status error">
        <strong>Couldn’t load data.</strong>
        <span>{error}</span>
        <span className="sub">Is the Worker running at {API_BASE}? Seed it with /seed first.</span>
      </div>
    );
  if (!snapshot) return null;

  return (
    <>
      <StatStrip models={filtered} />

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
        <div className="updated">
          {stale && <span className="cached-badge">bundled snapshot</span>}
          {filtered.length} models · updated{" "}
          {new Date(snapshot.generatedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
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

      <div className="full" style={{ ["--i" as any]: 5 }}>
        <ModelTable models={filtered} />
      </div>
    </>
  );
}

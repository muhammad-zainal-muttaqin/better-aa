// Layout-matching skeleton shown while the snapshot loads (no spinners).
export default function Skeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="kpi-strip">
        {[0, 1, 2, 3].map((i) => (
          <div className="kpi sk" key={i} style={{ ["--i" as any]: i }}>
            <span className="sk-line w40" />
            <span className="sk-line w60 tall" />
            <span className="sk-line w50" />
          </div>
        ))}
      </div>
      <div className="sk-card hero" style={{ ["--i" as any]: 0 }} />
      <div className="bento">
        {[1, 2, 3, 4].map((i) => (
          <div className="sk-card" key={i} style={{ ["--i" as any]: i }} />
        ))}
      </div>
    </div>
  );
}

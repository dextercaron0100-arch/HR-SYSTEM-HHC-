export function MetricCard({
  label,
  value,
  note,
  trend = 72
}: {
  label: string;
  value: string;
  note: string;
  trend?: number;
}) {
  return (
    <div className="card metric-card">
      <div className="metric-head">
        <span>{label}</span>
        <button className="ghost-dot" type="button" aria-label={`${label} menu`}>
          ...
        </button>
      </div>
      <strong>{value}</strong>
      <div className="metric-track" aria-hidden="true">
        <span style={{ width: `${trend}%` }} />
      </div>
      <small>{note}</small>
    </div>
  );
}

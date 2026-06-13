function getStrokeOffset(progress: number) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return circumference - (progress / 100) * circumference;
}

export function RadialMeter({
  value,
  label,
  tone = "teal"
}: {
  value: string;
  label: string;
  tone?: "teal" | "lime" | "mint" | "deep";
}) {
  const numericValue = Number(value.replace(/[^0-9.]/g, "")) || 0;

  return (
    <div className={`radial radial-${tone}`}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`${label} ${value}`}>
        <circle className="radial-track" cx="60" cy="60" r="42" />
        <circle
          className="radial-progress"
          cx="60"
          cy="60"
          r="42"
          style={{ strokeDashoffset: `${getStrokeOffset(numericValue)}px` }}
        />
      </svg>
      <div className="radial-content">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Sparkline({
  values,
  color = "#2ab49a"
}: {
  values: number[];
  color?: string;
}) {
  const safeValues = values.length > 1 ? values : values.length === 1 ? [values[0], values[0]] : [0, 0];
  const max = Math.max(...safeValues);
  const min = Math.min(...safeValues);
  const width = 260;
  const height = 100;
  const points = safeValues
    .map((value, index) => {
      const x = (index / (safeValues.length - 1)) * width;
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = height - normalized * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline className="sparkline-area" points={points} fill="url(#spark-fill)" />
      <polyline className="sparkline-line" points={points} />
    </svg>
  );
}

export function HeatGrid({
  rows,
  cols,
  cells
}: {
  rows: number;
  cols: number;
  cells: number[];
}) {
  return (
    <div
      className="heat-grid"
      aria-hidden="true"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows * cols }).map((_, index) => {
        const level = Math.max(0, Math.min(3, cells[index] ?? 0));
        return <span key={index} className={`heat-cell level-${level}`} />;
      })}
    </div>
  );
}

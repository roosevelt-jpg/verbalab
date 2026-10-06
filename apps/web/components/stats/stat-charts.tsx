'use client';

/** Lightweight SVG charts for console — no chart library dependency. */

export function ProgressRing({
  value,
  max,
  label,
  sublabel,
}: {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="lg-stat-card">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(16,38,77,0.08)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="var(--action-primary, #00B8AE)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
        />
        <text x="48" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--brand-navy, #10264D)">
          {pct}%
        </text>
      </svg>
      <div>
        <div className="lg-stat-label">{label}</div>
        {sublabel ? <div className="lg-stat-sub">{sublabel}</div> : null}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="lg-metric-card">
      <div className="lg-stat-label">{label}</div>
      <div className="lg-metric-value">{value}</div>
      {hint ? <div className="lg-stat-sub">{hint}</div> : null}
    </div>
  );
}

export function LineChart({
  series,
  title,
  color = '#00B8AE',
  unitLabel,
}: {
  series: number[];
  title: string;
  color?: string;
  unitLabel?: string;
}) {
  const w = 280;
  const h = 88;
  const pad = 8;
  const max = Math.max(...series, 1);
  const pts = series
    .map((v, i) => {
      const x = pad + (i / Math.max(series.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const area = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;

  return (
    <div className="lg-stat-card lg-stat-card-wide">
      <div className="lg-stat-label">{title}</div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
        <polygon points={area} fill={color} opacity="0.12" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <div className="lg-stat-sub">
        Last {series.length} days · peak {max.toLocaleString()}
        {unitLabel ? ` ${unitLabel}` : ''}
      </div>
    </div>
  );
}

export function BarChart({
  bars,
  title,
}: {
  bars: { label: string; value: number }[];
  title: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="lg-stat-card lg-stat-card-wide">
      <div className="lg-stat-label">{title}</div>
      <div className="lg-bar-chart">
        {bars.map((b) => (
          <div key={b.label} className="lg-bar-row">
            <span className="lg-bar-label">{b.label}</span>
            <span className="lg-bar-track">
              <span
                className="lg-bar-fill"
                style={{ width: b.value === 0 ? '0%' : `${Math.max(4, (b.value / max) * 100)}%` }}
              />
            </span>
            <span className="lg-bar-value">{b.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dual-series line chart for timeline comparisons (e.g. requests vs characters). */
export function DualLineChart({
  seriesA,
  seriesB,
  title,
  labelA,
  labelB,
  colorA = '#00B8AE',
  colorB = '#10264D',
}: {
  seriesA: number[];
  seriesB: number[];
  title: string;
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
}) {
  const w = 320;
  const h = 100;
  const pad = 8;
  const max = Math.max(...seriesA, ...seriesB, 1);
  const toPts = (series: number[]) =>
    series
      .map((v, i) => {
        const x = pad + (i / Math.max(series.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - (v / max) * (h - pad * 2);
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="lg-stat-card lg-stat-card-wide">
      <div className="lg-stat-label">{title}</div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
        <polyline points={toPts(seriesA)} fill="none" stroke={colorA} strokeWidth="2.5" strokeLinejoin="round" />
        <polyline
          points={toPts(seriesB)}
          fill="none"
          stroke={colorB}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4 3"
          opacity={0.85}
        />
      </svg>
      <div className="lg-stat-legend">
        <span>
          <i style={{ background: colorA }} /> {labelA}
        </span>
        <span>
          <i style={{ background: colorB }} /> {labelB}
        </span>
      </div>
    </div>
  );
}

/** Deterministic spark series from aggregate usage when day buckets are unavailable. */
export function seedUsageSeries(used: number, requests: number, days = 14): number[] {
  if (used <= 0 && requests <= 0) {
    return Array.from({ length: days }, () => 0);
  }
  const base = Math.max(1, Math.floor(used / Math.max(days, 1)));
  const reqBase = Math.max(1, Math.floor(requests / Math.max(days, 1)));
  return Array.from({ length: days }, (_, i) => {
    const wave = 0.65 + 0.35 * Math.sin(i / 2.2) + ((i * 17) % 7) / 40;
    return Math.round(base * wave + reqBase * 3 * ((i % 5) / 5));
  });
}

export function seedRequestSeries(requests: number, days = 14): number[] {
  const base = Math.max(1, Math.floor(requests / Math.max(days, 1)));
  return Array.from({ length: days }, (_, i) => {
    const wave = 0.55 + 0.45 * Math.cos(i / 1.8) + ((i * 11) % 5) / 20;
    return Math.max(0, Math.round(base * wave));
  });
}

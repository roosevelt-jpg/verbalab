'use client';

import type { ReactNode } from 'react';

/** System-activity visuals for Lugemi console — brand teal/navy, no purple slop. */

export function LivePulse({ label = 'Live' }: { label?: string }) {
  return (
    <span className="lg-live-pulse" aria-label={label}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

export function StatusRing({
  status,
  label,
  detail,
}: {
  status: 'ok' | 'warn' | 'idle' | 'bad';
  label: string;
  detail?: string;
}) {
  return (
    <div className={`lg-status-ring lg-status-ring--${status}`}>
      <div className="lg-status-ring__orb" aria-hidden="true">
        <span />
      </div>
      <div>
        <div className="lg-stat-label">{label}</div>
        {detail ? <div className="lg-stat-sub">{detail}</div> : null}
      </div>
    </div>
  );
}

export function UsageMeter({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="lg-usage-meter">
      <div className="lg-usage-meter__head">
        <span className="lg-stat-label">{label}</span>
        <span className="lg-usage-meter__pct">{pct}%</span>
      </div>
      <div
        className="lg-usage-meter__track"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="lg-usage-meter__fill" style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <div className="lg-stat-sub">
        {value.toLocaleString()}
        {max > 0 ? ` / ${max.toLocaleString()}` : ''}
        {unit ? ` ${unit}` : ''}
      </div>
    </div>
  );
}

export function Sparkline({
  series,
  color = '#00B8AE',
  title,
}: {
  series: number[];
  color?: string;
  title?: string;
}) {
  const w = 120;
  const h = 36;
  const pad = 2;
  const max = Math.max(...series, 1);
  const pts = series
    .map((v, i) => {
      const x = pad + (i / Math.max(series.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      className="lg-sparkline"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={title ?? 'Sparkline'}
    >
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function PipelineStrip({
  stages,
  title,
}: {
  title: string;
  stages: Array<{ id: string; label: string; state: 'active' | 'ready' | 'idle' | 'error' }>;
}) {
  return (
    <div className="lg-pipeline">
      <div className="lg-pipeline__head">
        <span className="lg-stat-label">{title}</span>
        <LivePulse label="Pipeline" />
      </div>
      <ol className="lg-pipeline__stages">
        {stages.map((s, i) => (
          <li key={s.id} className={`lg-pipeline__stage lg-pipeline__stage--${s.state}`}>
            <span className="lg-pipeline__dot" aria-hidden="true" />
            <span className="lg-pipeline__label">{s.label}</span>
            {i < stages.length - 1 ? <span className="lg-pipeline__link" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HeatList({
  title,
  items,
  empty = 'No activity yet',
}: {
  title: string;
  items: Array<{ id: string; label: string; value: number; hint?: string }>;
  empty?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="lg-heat-list">
      <div className="lg-stat-label">{title}</div>
      {items.length === 0 ? (
        <p className="lg-stat-sub" style={{ margin: '0.5rem 0 0' }}>
          {empty}
        </p>
      ) : (
        <ul>
          {items.map((item) => {
            const intensity = 0.12 + (item.value / max) * 0.55;
            return (
              <li
                key={item.id}
                style={{
                  background: `linear-gradient(90deg, rgba(0, 184, 174, ${intensity}), transparent 92%)`,
                }}
              >
                <span className="lg-heat-list__label">{item.label}</span>
                <span className="lg-heat-list__value">
                  {item.value.toLocaleString()}
                  {item.hint ? <em>{item.hint}</em> : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ActivityBoard({
  title,
  children,
  kicker,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section className="lg-activity-board" aria-label={title}>
      <header className="lg-activity-board__head">
        {kicker ? <p className="lg-workspace-kicker">{kicker}</p> : null}
        <h2 className="lg-activity-board__title">{title}</h2>
      </header>
      <div className="lg-activity-board__body">{children}</div>
    </section>
  );
}

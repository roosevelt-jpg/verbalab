'use client';

import Link from 'next/link';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';

export type CreativeToolConfig = {
  title: string;
  lede: string;
  status: 'live' | 'companion' | 'roadmap';
  honesty: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  icon: string;
  bullets?: string[];
};

export function CreativeToolSurface({ config }: { config: CreativeToolConfig }) {
  const badge =
    config.status === 'live' ? 'Live' : config.status === 'companion' ? 'Companion' : 'Roadmap';

  return (
    <CreativeShell banner breadcrumb={config.title}>
      <div className="lg-creative-page-head">
        <div>
          <h1>
            {config.title}{' '}
            <span className="lg-creative-alpha">{badge}</span>
          </h1>
          <p>{config.lede}</p>
        </div>
        <div className="lg-creative-actions">
          {config.secondaryHref && config.secondaryLabel ? (
            <Link href={config.secondaryHref} className="lg-creative-btn">
              {config.secondaryLabel}
            </Link>
          ) : null}
          <Link href={config.primaryHref} className="lg-creative-btn primary">
            {config.primaryLabel}
          </Link>
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--lc-line)',
          borderRadius: 16,
          padding: '2rem 1.5rem',
          textAlign: 'center',
          background:
            'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(0,184,174,0.12), transparent 60%), var(--lc-bg)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 1rem',
            borderRadius: 16,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,184,174,0.12)',
            color: 'var(--lc-navy)',
          }}
        >
          <CreativeIcon name={config.icon} width={28} height={28} />
        </div>
        <p style={{ margin: '0 auto', maxWidth: '36rem', color: 'var(--lc-muted)', lineHeight: 1.55 }}>
          {config.honesty}
        </p>
        {config.bullets?.length ? (
          <ul
            style={{
              textAlign: 'left',
              maxWidth: '28rem',
              margin: '1.25rem auto 0',
              color: 'var(--lc-muted)',
              lineHeight: 1.55,
            }}
          >
            {config.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </CreativeShell>
  );
}

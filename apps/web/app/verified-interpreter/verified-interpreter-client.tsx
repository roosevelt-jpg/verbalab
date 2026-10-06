'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';

type Pillar = {
  id: string;
  displayName: string;
  slug: string;
  family: string;
  api: string;
  console: string;
  notes: string;
};

type Engine = {
  product: string;
  note: string;
  pillars: Pillar[];
};

type Corridor = {
  id: string;
  label: string;
  varietyId: string;
  evaluated: boolean;
};

export function VerifiedInterpreterClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [eng, cor] = await Promise.all([
          apiFetch<Engine>('/v1/portfolio/engine'),
          apiFetch<{ corridors: Corridor[] }>('/v1/portfolio/corridors'),
        ]);
        setEngine(eng);
        setCorridors(cor.corridors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      }
    })();
  }, []);

  return (
    <PortfolioShell
      title={engine?.product ?? 'Lugemi Verified Interpreter'}
      lede={
        engine?.note ??
        'Mix + Fidelity + Live for meaning-preserving interpretation with verification and repair.'
      }
      docsHref="/docs"
    >
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <section aria-labelledby="vi-corridors">
        <h2 id="vi-corridors" style={{ fontSize: '1.05rem', color: 'var(--brand-navy)' }}>
          Pilot corridors
        </h2>
        <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.5rem' }}>
          {corridors.map((c) => (
            <li key={c.id} className="vl-panel" style={{ padding: '0.75rem 1rem' }}>
              <strong>{c.label}</strong>
              <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                {c.varietyId}
                {c.evaluated ? ' · evaluated' : ' · not yet evaluated'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="vi-pillars" style={{ marginTop: '1.5rem' }}>
        <h2 id="vi-pillars" style={{ fontSize: '1.05rem', color: 'var(--brand-navy)' }}>
          Portfolio pillars
        </h2>
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
            marginTop: '0.65rem',
          }}
        >
          {(engine?.pillars ?? []).map((p) => (
            <Link
              key={p.id}
              href={p.console}
              className="vl-panel"
              style={{ padding: '0.9rem 1rem', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ fontWeight: 650, color: 'var(--brand-navy)' }}>{p.displayName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                {p.slug} · {p.family}
              </div>
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.85rem', lineHeight: 1.45, color: '#555' }}>
                {p.notes}
              </p>
              <code style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>{p.api}</code>
            </Link>
          ))}
        </div>
      </section>
    </PortfolioShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';
import { SearchableCombobox } from '@/components/searchable-combobox';

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
  languageCode?: string;
  evaluated: boolean;
};

export function VerifiedInterpreterClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [eng, cor] = await Promise.all([
          apiFetch<Engine>('/v1/portfolio/engine'),
          apiFetch<{ corridors: Corridor[]; total?: number }>('/v1/portfolio/corridors'),
        ]);
        setEngine(eng);
        setCorridors(cor.corridors);
        setTotal(cor.total ?? cor.corridors.length);
        const preferred =
          cor.corridors.find((c) => c.varietyId === 'ak-GH-twi') ?? cor.corridors[0];
        if (preferred) setSelected(preferred.id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      }
    })();
  }, []);

  const selectedCorridor = corridors.find((c) => c.id === selected) ?? null;
  const listed = selectedCorridor
    ? [selectedCorridor]
    : corridors.filter((c) => c.evaluated).concat(corridors.filter((c) => !c.evaluated).slice(0, 16));

  return (
    <PortfolioShell
      title={engine?.product ?? 'Lugemi Verified Interpreter'}
      lede={
        engine?.note ??
        'Mix + Fidelity + Live for meaning-preserving interpretation with verification and repair.'
      }
      docsHref="/docs"
    >
      {error ? (
        <p style={{ color: 'var(--bad)' }}>
          {error}{' '}
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            style={{ marginLeft: '0.5rem', minHeight: 32, padding: '0.25rem 0.65rem' }}
            onClick={() => {
              setError(null);
              void (async () => {
                try {
                  const [eng, cor] = await Promise.all([
                    apiFetch<Engine>('/v1/portfolio/engine'),
                    apiFetch<{ corridors: Corridor[]; total?: number }>('/v1/portfolio/corridors'),
                  ]);
                  setEngine(eng);
                  setCorridors(cor.corridors);
                  setTotal(cor.total ?? cor.corridors.length);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to load portfolio');
                }
              })();
            }}
          >
            Retry
          </button>
        </p>
      ) : null}

      <section aria-labelledby="vi-corridors">
        <h2 id="vi-corridors" style={{ fontSize: '1.05rem', color: 'var(--brand-navy)' }}>
          Corridors ({total || corridors.length} language↔English)
        </h2>
        <div style={{ marginTop: '0.65rem', maxWidth: '28rem' }}>
          <SearchableCombobox
            value={selected}
            onChange={setSelected}
            options={corridors.map((c) => ({
              value: c.id,
              label: `${c.label}${c.evaluated ? ' · strategic' : ''}`,
              keywords: `${c.id} ${c.varietyId} ${c.languageCode ?? ''}`,
              group: c.evaluated ? 'Strategic' : 'Registry',
            }))}
            placeholder="Search corridor…"
            emptyLabel="Select corridor…"
            aria-label="Verified Interpreter corridor"
          />
        </div>
        <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.5rem' }}>
          {listed.map((c) => (
            <li key={c.id} className="vl-panel" style={{ padding: '0.75rem 1rem' }}>
              <strong>{c.label}</strong>
              <span style={{ color: 'var(--muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                {c.varietyId}
                {c.evaluated ? ' · strategic' : ' · registry'}
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

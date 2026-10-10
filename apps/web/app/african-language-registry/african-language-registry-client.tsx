'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type WorldRegionId = 'africa' | 'sea' | 'mena' | 'eu' | 'uk' | 'latam' | 'na' | 'global';

type Lang = {
  code: string;
  name: string;
  nativeName?: string;
  family: string;
  writingSystems: string[];
  dialects: string[];
  accents?: string[];
  regions: string[];
  worldRegions?: WorldRegionId[];
  lifestyle?: { habits?: string[]; routines?: string[]; culturalNotes?: string };
};

type RegionMeta = {
  id: WorldRegionId;
  label: string;
  shortLabel: string;
  note: string;
  count?: number;
  africaFirst?: boolean;
};

type Engine = {
  product: string;
  note: string;
  counts?: Record<string, number>;
  honesty: Record<string, boolean>;
  languages?: Lang[];
  regions?: RegionMeta[];
};

const FALLBACK_TABS: RegionMeta[] = [
  { id: 'africa', label: 'Africa', shortLabel: 'Africa', note: 'Africa-first', africaFirst: true },
  { id: 'sea', label: 'Southeast Asia', shortLabel: 'SEA', note: 'Southeast Asia' },
  { id: 'mena', label: 'Middle East', shortLabel: 'MENA', note: 'Middle East' },
  { id: 'eu', label: 'European Union', shortLabel: 'EU', note: 'EU' },
  { id: 'uk', label: 'United Kingdom', shortLabel: 'UK', note: 'UK' },
  { id: 'latam', label: 'Latin America', shortLabel: 'LATAM', note: 'LATAM' },
  { id: 'na', label: 'North America', shortLabel: 'NA', note: 'NA' },
  { id: 'global', label: 'Global', shortLabel: 'Global', note: 'All regions' },
];

export function AfricanLanguageRegistryClient() {
  const [region, setRegion] = useState<WorldRegionId>('africa');
  const [tabs, setTabs] = useState<RegionMeta[]>(FALLBACK_TABS);
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    void apiFetch<{ regions: RegionMeta[]; counts: Record<string, number> }>(
      '/v1/regional-language-registry/regions',
    )
      .then((res) => {
        if (res.regions?.length) setTabs(res.regions);
      })
      .catch(() => {
        /* keep Africa-first fallback tabs */
      });
  }, []);

  useEffect(() => {
    setError(null);
    setData(null);
    const regional = `/v1/regional-language-registry/languages?region=${region}`;
    void Promise.all([
      apiFetch<Engine>('/v1/regional-language-registry/engine').catch(() =>
        apiFetch<Engine>('/v1/african-language-registry/engine'),
      ),
      apiFetch<{ languages: Lang[]; count: number; counts?: Record<string, number> }>(regional).catch(
        () =>
          apiFetch<{ languages: Lang[]; count: number }>('/v1/african-language-registry/languages'),
      ),
    ])
      .then(([engine, langs]) => {
        setData({
          ...engine,
          languages: langs.languages,
          counts: ('counts' in langs ? langs.counts : undefined) ?? engine.counts,
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [region]);

  const filtered = useMemo(() => {
    const list = data?.languages ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (l) =>
        l.code.toLowerCase().includes(needle) ||
        l.name.toLowerCase().includes(needle) ||
        (l.nativeName ?? '').toLowerCase().includes(needle) ||
        l.family.toLowerCase().includes(needle) ||
        l.dialects.some((d) => d.toLowerCase().includes(needle)) ||
        (l.accents ?? []).some((a) => a.toLowerCase().includes(needle)) ||
        (l.lifestyle?.habits ?? []).some((h) => h.toLowerCase().includes(needle)) ||
        (l.lifestyle?.routines ?? []).some((h) => h.toLowerCase().includes(needle)),
    );
  }, [data?.languages, q]);

  const activeTab = tabs.find((t) => t.id === region) ?? tabs[0];
  const countForRegion =
    data?.counts?.[region] ??
    tabs.find((t) => t.id === region)?.count ??
    filtered.length;

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        {region === 'africa'
          ? (data?.product?.includes('Regional') ? 'African Language Registry' : data?.product) ??
            'African Language Registry'
          : 'Regional Language Registry'}
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.25rem', maxWidth: '44rem' }}>
        {activeTab?.note ??
          'Africa-first language registry with browsable global regions. Default demo pair: English → Twi (ak / ak-GH).'}
      </p>

      <div
        role="tablist"
        aria-label="World regions"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '1rem',
        }}
      >
        {tabs.map((tab) => {
          const selected = tab.id === region;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setRegion(tab.id)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: 8,
                border: selected ? '1px solid var(--action-primary, #007c78)' : '1px solid var(--line)',
                background: selected ? 'var(--brand-soft, rgba(0,184,174,0.12))' : 'var(--bg, #fff)',
                color: 'var(--ink)',
                fontWeight: tab.africaFirst || tab.id === 'africa' ? 700 : selected ? 650 : 500,
                cursor: 'pointer',
                fontSize: '0.88rem',
              }}
            >
              {tab.shortLabel}
              {typeof tab.count === 'number' ? (
                <span style={{ marginLeft: 6, color: 'var(--muted)', fontWeight: 500 }}>
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p style={{ margin: '0 0 1rem', color: 'var(--brand-navy)', fontWeight: 600 }}>
        {countForRegion} languages in {activeTab?.shortLabel ?? region}
        {region === 'africa' ? ' · Africa-first · default EN→Twi' : ''}
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem', maxWidth: '24rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Search languages, dialects, accents, lifestyle
            </span>
            <input
              className="vl-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. Twi, Thai, Spanish, Quechua…"
            />
          </label>
          <div
            style={{
              overflow: 'auto',
              border: '1px solid var(--border, #e5e7eb)',
              borderRadius: 8,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'var(--surface, #f8fafc)' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Name</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Code</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Family</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Dialects / accents</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Lifestyle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.code} style={{ borderTop: '1px solid var(--border, #e5e7eb)' }}>
                    <td style={{ padding: '0.55rem 0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      {l.nativeName && l.nativeName !== l.name ? (
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{l.nativeName}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
                      {l.code}
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--muted)' }}>{l.family}</td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--muted)', maxWidth: '14rem' }}>
                      {[...l.dialects, ...(l.accents ?? [])].slice(0, 4).join(', ') || '—'}
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem', color: 'var(--muted)', maxWidth: '14rem' }}>
                      {[...(l.lifestyle?.habits ?? []), ...(l.lifestyle?.routines ?? [])]
                        .slice(0, 3)
                        .join(' · ') || l.regions.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0 }}>
            <Link href="/translate?source=en&target=ak">Translate English → Twi</Link>
            {' · '}
            <Link href="/coverage">Africa coverage directory</Link>
            {' · '}
            <Link href="/african-intelligence-cloud">African Intelligence Cloud</Link>
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}

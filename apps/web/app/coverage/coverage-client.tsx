'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import {
  AFRICA_LANGUAGE_CATALOG,
  AFRICA_REGIONS,
} from '@/data/africa-language-catalog';
import '@/components/media/anamorphic.css';

type LanguageRow = {
  code: string;
  name: string;
  tier: string;
  script: string | null;
  worldRegions?: string[];
};

type FocusPair = {
  sourceLang: string;
  targetLang: string;
  inRegistry: boolean;
  evalStatus: string;
  segmentCount: number;
  exactMatchRate: number | null;
  meanCharSimilarity: number | null;
};

type CoveragePayload = {
  disclaimer: string;
  note: string;
  source?: string;
  languages: {
    total: number;
    strategicAfrican: number;
    africaFirst?: boolean;
    regionalCounts?: Record<string, number>;
    codes: LanguageRow[];
  };
  focusPairs: FocusPair[];
};

const WORLD_REGION_TABS = [
  { id: 'all', label: 'All' },
  { id: 'africa', label: 'Africa' },
  { id: 'sea', label: 'Southeast Asia' },
  { id: 'mena', label: 'Middle East' },
  { id: 'eu', label: 'EU' },
  { id: 'uk', label: 'UK' },
  { id: 'latam', label: 'Latin America' },
  { id: 'na', label: 'North America' },
] as const;

type WorldTab = (typeof WORLD_REGION_TABS)[number]['id'];

async function loadLiveCoverage(): Promise<CoveragePayload> {
  // Prefer same-origin proxy (no CORS). Fall back to direct API URL.
  const attempts = ['/api/language-coverage', null] as const;
  let lastError: Error | null = null;

  for (const path of attempts) {
    try {
      const url =
        path ??
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/v1/coverage`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(payload.error?.message ?? `Coverage HTTP ${res.status}`);
      }
      return (await res.json()) as CoveragePayload;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('Load failed');
}

export function CoverageClient() {
  const [data, setData] = useState<CoveragePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [africaRegion, setAfricaRegion] = useState<(typeof AFRICA_REGIONS)[number] | 'All'>('All');
  const [worldTab, setWorldTab] = useState<WorldTab>('all');

  const catalogStats = useMemo(() => {
    const countries = new Set(AFRICA_LANGUAGE_CATALOG.map((e) => e.countryCode)).size;
    const languages = new Set(AFRICA_LANGUAGE_CATALOG.map((e) => e.code)).size;
    return { countries, languages };
  }, []);

  const catalogRows = useMemo(() => {
    const rows =
      africaRegion === 'All'
        ? AFRICA_LANGUAGE_CATALOG
        : AFRICA_LANGUAGE_CATALOG.filter((e) => e.region === africaRegion);
    return rows.slice(0, 120);
  }, [africaRegion]);

  const liveRows = useMemo(() => {
    const codes = data?.languages.codes ?? [];
    if (worldTab === 'all') return codes;
    return codes.filter((row) => (row.worldRegions ?? []).includes(worldTab));
  }, [data, worldTab]);

  useEffect(() => {
    let cancelled = false;
    void loadLiveCoverage()
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const liveReady = Boolean(data);

  return (
    <div className="vl-fade-up" style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
      <div className="lg-hub-hero">
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', letterSpacing: '-0.03em', fontSize: '2.35rem' }}>
            Language coverage
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '40rem' }}>
            Africa-first completeness for speaking agents across Africa, Southeast Asia, the Middle East, the EU, the
            UK, Latin America, and North America. Registry membership is not a claim that every language or task is
            live.
          </p>
        </div>
        <AnamorphicPanel variant="coverage" size="sm" label="Coverage depth" />
      </div>

      {liveReady ? (
        <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1.25rem' }}>
          <p className="vl-panel" style={{ margin: 0, padding: '1.1rem 1.25rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            {data!.disclaimer} {data!.note}
          </p>

          <section className="vl-panel" style={{ padding: '1.35rem' }}>
            <h2 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.25rem', fontWeight: 600 }}>
              Worldwide live coverage
            </h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>
              {data!.languages.total} languages in the live registry (Africa-first), including{' '}
              {data!.languages.strategicAfrican} African / strategic-African entries
              {data!.source ? ` · source ${data!.source}` : ''}.
            </p>
            {data!.languages.regionalCounts ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '-0.35rem' }}>
                Region counts — Africa {data!.languages.regionalCounts.africa ?? '—'} · SEA{' '}
                {data!.languages.regionalCounts.sea ?? '—'} · MENA {data!.languages.regionalCounts.mena ?? '—'} · EU{' '}
                {data!.languages.regionalCounts.eu ?? '—'} · UK {data!.languages.regionalCounts.uk ?? '—'} · LATAM{' '}
                {data!.languages.regionalCounts.latam ?? '—'} · NA {data!.languages.regionalCounts.na ?? '—'}.
              </p>
            ) : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
              {WORLD_REGION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`vl-mode-tab${worldTab === tab.id ? ' is-active' : ''}`}
                  onClick={() => setWorldTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
                gap: '0.45rem 1rem',
                padding: 0,
                margin: 0,
                listStyle: 'none',
                maxHeight: '22rem',
                overflow: 'auto',
              }}
            >
              {liveRows.map((lang) => (
                <li key={lang.code} style={{ fontSize: '0.9rem' }}>
                  <strong>{lang.name}</strong>
                  <span style={{ color: 'var(--muted)' }}> ({lang.code})</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="vl-panel" style={{ padding: '1.35rem' }}>
            <h2 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.25rem', fontWeight: 600 }}>
              Evaluated translation pairs
            </h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>
              Golden sets currently cover English to Swahili, Yoruba, and Amharic. Scores appear only after an eval
              run.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {data!.focusPairs.map((pair) => (
                <div
                  key={`${pair.sourceLang}-${pair.targetLang}`}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-card)',
                    padding: '0.9rem 1rem',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {pair.sourceLang} → {pair.targetLang}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {pair.evalStatus} · {pair.segmentCount} segments
                    {pair.exactMatchRate != null ? ` · exact match ${pair.exactMatchRate}` : ''}
                    {pair.meanCharSimilarity != null ? ` · char similarity ${pair.meanCharSimilarity}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!liveReady ? (
        <section className="vl-panel" style={{ padding: '1.35rem', marginTop: '1.25rem' }}>
          <h2 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.25rem', fontWeight: 600 }}>
            Africa catalog (prefill)
          </h2>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            Curated product catalog: {catalogStats.countries} countries · {catalogStats.languages} language codes ·{' '}
            {AFRICA_REGIONS.length} regions. Shown while live coverage loads
            {error ? ' or when the API is unreachable' : ''}. Admins can later edit{' '}
            <code className="vl-code">apps/web/data/africa-language-catalog.ts</code>.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
            <button
              type="button"
              className={`vl-mode-tab${africaRegion === 'All' ? ' is-active' : ''}`}
              onClick={() => setAfricaRegion('All')}
            >
              All
            </button>
            {AFRICA_REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`vl-mode-tab${africaRegion === r ? ' is-active' : ''}`}
                onClick={() => setAfricaRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
              gap: '0.55rem 1rem',
              padding: 0,
              margin: 0,
              listStyle: 'none',
              maxHeight: '22rem',
              overflow: 'auto',
            }}
          >
            {catalogRows.map((row) => (
              <li key={`${row.countryCode}-${row.code}-${row.name}`} style={{ fontSize: '0.88rem' }}>
                <strong>{row.name}</strong>
                <span style={{ color: 'var(--muted)' }}>
                  {' '}
                  ({row.code}) · {row.country}
                </span>
                {row.ethnicVarieties.length ? (
                  <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                    {row.ethnicVarieties.slice(0, 3).join(', ')}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading live registry…</p> : null}
      {error && !data ? (
        <p style={{ color: 'var(--bad)' }}>
          Could not load live coverage ({error}). The Africa catalog above remains available. Public docs at{' '}
          <Link href="/docs">/docs</Link>.
        </p>
      ) : null}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import {
  AFRICA_LANGUAGE_CATALOG,
  AFRICA_REGIONS,
} from '@/data/africa-language-catalog';
import '@/components/media/anamorphic.css';

type LanguageRow = { code: string; name: string; tier: string; script: string };

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
  languages: { total: number; strategicAfrican: number; codes: LanguageRow[] };
  focusPairs: FocusPair[];
};

export function CoverageClient {
  const [data, setData] = useState<CoveragePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<(typeof AFRICA_REGIONS)[number] | 'All'>('All');

  const catalogStats = useMemo( => {
    const countries = new Set(AFRICA_LANGUAGE_CATALOG.map((e) => e.countryCode)).size;
    const languages = new Set(AFRICA_LANGUAGE_CATALOG.map((e) => e.code)).size;
    return { countries, languages };
  }, []);

  const catalogRows = useMemo( => {
    const rows =
      region === 'All'
        ? AFRICA_LANGUAGE_CATALOG
        : AFRICA_LANGUAGE_CATALOG.filter((e) => e.region === region);
    return rows.slice(0, 120);
  }, [region]);

  useEffect( => {
    void fetch(`${API_URL}/v1/coverage`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Coverage HTTP ${res.status}`);
        setData((await res.json) as CoveragePayload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="vl-fade-up" style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <BrandMark />
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/docs" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Docs
          </Link>
          <Link href="/playground" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Playground
          </Link>
        </div>
      </div>

      <div className="lg-hub-hero" style={{ marginTop: '1.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', letterSpacing: '-0.03em', fontSize: '2.35rem' }}>
            Language coverage
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '40rem' }}>
            Africa-first completeness for speaking agents: countries, languages, scripts, and ethnic varieties.
            Latin America, Southeast Asia, the Middle East, and the EU are in strategic scope. Registry membership is
            not a claim that every language or task is live.
          </p>
        </div>
        <AnamorphicPanel variant="coverage" size="sm" label="Coverage depth" />
      </div>

      <section className="vl-panel" style={{ padding: '1.35rem', marginTop: '1.25rem' }}>
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.25rem', fontWeight: 600 }}>
          Africa catalog (prefill)
        </h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>
          Curated product catalog: {catalogStats.countries} countries · {catalogStats.languages} language codes ·{' '}
          {AFRICA_REGIONS.length} regions. Admins can later edit{' '}
          <code className="vl-code">apps/web/data/africa-language-catalog.ts</code>.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
          <button
            type="button"
            className={`vl-mode-tab${region === 'All' ? ' is-active' : ''}`}
            onClick={ => setRegion('All')}
          >
            All
          </button>
          {AFRICA_REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`vl-mode-tab${region === r ? ' is-active' : ''}`}
              onClick={ => setRegion(r)}
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

      {error ? (
        <p style={{ color: 'var(--bad)' }}>
          Could not load live coverage ({error}). The Africa catalog above remains available. Public docs at{' '}
          <Link href="/docs">/docs</Link>.
        </p>
      ) : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading live registry…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1.25rem' }}>
          <p className="vl-panel" style={{ margin: 0, padding: '1.1rem 1.25rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            {data.disclaimer} {data.note}
          </p>

          <div className="vl-panel" style={{ padding: '1.35rem' }}>
            <h2 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.25rem', fontWeight: 600 }}>
              Live registry
            </h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>
              {data.languages.total} languages in the core registry, including {data.languages.strategicAfrican}{' '}
              strategic African entries.
            </p>
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
                gap: '0.45rem 1rem',
                padding: 0,
                margin: 0,
                listStyle: 'none',
              }}
            >
              {data.languages.codes.map((lang) => (
                <li key={lang.code} style={{ fontSize: '0.9rem' }}>
                  <strong>{lang.name}</strong>
                  <span style={{ color: 'var(--muted)' }}> ({lang.code})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="vl-panel" style={{ padding: '1.35rem' }}>
            <h2 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.25rem', fontWeight: 600 }}>
              Evaluated translation pairs
            </h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>
              Golden sets currently cover English to Swahili, Yoruba, and Amharic. Scores appear only after an eval
              run.
            </p>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {data.focusPairs.map((pair) => (
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
    </div>
  );
}

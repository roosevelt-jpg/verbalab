'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import {
  AFRICA_CATALOG_STATS,
  AFRICA_LANGUAGE_CATALOG,
  AFRICA_REGIONS,
  type AfricaLanguageEntry,
} from '@/data/africa-language-catalog';

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

const COUNTRIES = Array.from(new Set(AFRICA_LANGUAGE_CATALOG.map((e) => e.country))).sort();

function matchesQuery(entry: AfricaLanguageEntry, q: string) {
  if (!q) return true;
  const hay = [
    entry.country,
    entry.region,
    entry.code,
    entry.name,
    entry.nativeName,
    ...entry.ethnicVarieties,
    ...entry.scripts,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function CoverageClient() {
  const [data, setData] = useState<CoveragePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string>('all');
  const [country, setCountry] = useState<string>('all');

  useEffect(() => {
    void fetch(`${API_URL}/v1/coverage`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Coverage HTTP ${res.status}`);
        setData((await res.json()) as CoveragePayload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return AFRICA_LANGUAGE_CATALOG.filter((entry) => {
      if (region !== 'all' && entry.region !== region) return false;
      if (country !== 'all' && entry.country !== country) return false;
      return matchesQuery(entry, q);
    });
  }, [q, region, country]);

  const countriesInRegion =
    region === 'all'
      ? COUNTRIES
      : COUNTRIES.filter((c) => AFRICA_LANGUAGE_CATALOG.some((e) => e.country === c && e.region === region));

  const liveCodes = new Set((data?.languages.codes ?? []).map((l) => l.code));

  return (
    <div className="vl-fade-up" style={{ maxWidth: '72rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <BrandMark />
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Home
          </Link>
          <Link href="/docs" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Docs
          </Link>
          <Link href="/sign-up" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
            Start free
          </Link>
        </div>
      </div>

      <h1
        style={{
          margin: '1.75rem 0 0',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          fontSize: 'clamp(1.85rem, 4vw, 2.5rem)',
          color: 'var(--brand-navy)',
        }}
      >
        Africa language directory
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '42rem' }}>
        Lugemi covers languages and dialects across{' '}
        <strong style={{ color: 'var(--brand-navy)', fontWeight: 600 }}>
          all African countries and ethnic communities
        </strong>{' '}
        — a fully built Africa-first language intelligence platform. Latin America, Southeast Asia, the Middle East,
        and the EU are also in product scope.
      </p>

      <div
        className="vl-panel"
        style={{
          marginTop: '1.25rem',
          padding: '1.1rem 1.25rem',
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
        }}
      >
        <Stat label="African countries" value={String(AFRICA_CATALOG_STATS.countries)} />
        <Stat label="Catalog entries" value={String(AFRICA_CATALOG_STATS.languageEntries)} />
        <Stat label="Unique languages" value={String(AFRICA_CATALOG_STATS.uniqueLanguageNames)} />
        <Stat
          label="API registry (live seed)"
          value={data ? `${data.languages.strategicAfrican} African / ${data.languages.total} total` : '…'}
        />
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55, marginTop: '0.85rem', maxWidth: '48rem' }}>
        {AFRICA_CATALOG_STATS.sourceLabel}. {AFRICA_CATALOG_STATS.qualityNote}
      </p>

      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'minmax(0, 1.4fr) repeat(2, minmax(0, 0.8fr))',
          marginTop: '1.5rem',
        }}
        className="vl-coverage-filters"
      >
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={labelStyle}>Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Country, language, ethnic variety, script…"
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={labelStyle}>Region</span>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setCountry('all');
            }}
            style={inputStyle}
          >
            <option value="all">All regions</option>
            {AFRICA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={labelStyle}>Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
            <option value="all">All countries</option>
            {countriesInRegion.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--brand-navy)' }}>No languages match that filter</p>
          <p style={{ margin: '0.5rem 0 1rem', color: 'var(--muted)', lineHeight: 1.55 }}>
            Try another country, clear the search, or browse by region.
          </p>
          <button
            type="button"
            className="vl-btn vl-btn-secondary"
            onClick={() => {
              setQuery('');
              setRegion('all');
              setCountry('all');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', margin: '1rem 0 0.5rem', fontSize: '0.9rem' }}>
          Showing {filtered.length} of {AFRICA_CATALOG_STATS.languageEntries} catalog entries
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gap: '0.65rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(16.5rem, 1fr))',
          marginTop: '0.75rem',
        }}
      >
        {filtered.map((entry) => {
          const inLive = liveCodes.has(entry.code) || liveCodes.has(entry.code.split('-')[0]!);
          return (
            <article
              key={`${entry.countryCode}-${entry.code}-${entry.name}`}
              className="vl-panel"
              style={{ padding: '1rem 1.1rem', margin: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 650, color: 'var(--brand-navy)', lineHeight: 1.3 }}>{entry.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }} lang={entry.code}>
                    {entry.nativeName}
                  </div>
                </div>
                <span
                  className="vl-tag"
                  style={{
                    flexShrink: 0,
                    background: inLive ? 'rgba(15, 118, 110, 0.12)' : 'rgba(15, 23, 42, 0.06)',
                    color: inLive ? '#0f766e' : 'var(--muted)',
                  }}
                  title={inLive ? 'Present in API language seed registry' : 'Catalog scope'}
                >
                  {inLive ? 'API seed' : 'Catalog'}
                </span>
              </div>
              <p style={{ margin: '0.65rem 0 0', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.45 }}>
                {entry.country} · {entry.region}
                {entry.scripts.length ? ` · ${entry.scripts.join(', ')}` : ''}
              </p>
              {entry.ethnicVarieties.length > 0 ? (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', lineHeight: 1.45 }}>
                  Ethnic varieties: {entry.ethnicVarieties.join(', ')}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--brand-navy)', margin: '0 0 0.5rem' }}>
          API registry and evaluated pairs
        </h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, maxWidth: '40rem', marginTop: 0 }}>
          The directory above is the Africa product catalog. The live API seed and golden translation pairs below are
          what the gateway currently reports.
        </p>

        {error ? (
          <p style={{ color: 'var(--bad)' }}>
            Could not load live coverage ({error}). Browse the catalog above, or see <Link href="/docs">docs</Link>.
          </p>
        ) : null}
        {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading API registry…</p> : null}

        {data ? (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <p className="vl-panel" style={{ margin: 0, padding: '1.1rem 1.25rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              {data.disclaimer} {data.note}
            </p>

            <div className="vl-panel" style={{ padding: '1.35rem' }}>
              <h3 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 600 }}>
                Live seed registry
              </h3>
              <p style={{ color: 'var(--muted)', marginTop: 0 }}>
                {data.languages.total} languages in the core API seed, including {data.languages.strategicAfrican}{' '}
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
              <h3 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 600 }}>
                Evaluated translation pairs
              </h3>
              <p style={{ color: 'var(--muted)', marginTop: 0 }}>
                Golden sets currently cover English to Swahili, Yoruba, and Amharic. Scores appear after an eval run.
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
      </section>

      <style>{`
        @media (max-width: 720px) {
          .vl-coverage-filters {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>{value}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 'var(--radius-control)',
  border: '1px solid var(--line)',
  padding: '0.55rem 0.75rem',
  background: 'var(--surface-canvas, #fff)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
};

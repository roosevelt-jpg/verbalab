'use client';

import { useEffect, useMemo, useState } from 'react';
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
  corridor_count?: number;
  countries_covered?: number;
  country_pack_total?: number;
};

type Corridor = {
  id: string;
  label: string;
  varietyId: string;
  languageCode?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
  evaluated: boolean;
};

type CountryRow = {
  code: string;
  nameEn: string;
  region: string;
  corridorCount: number;
};

export function VerifiedInterpreterClient() {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [countriesCovered, setCountriesCovered] = useState(0);
  const [countryPackTotal, setCountryPackTotal] = useState(0);
  const [countryFilter, setCountryFilter] = useState('');
  const [selected, setSelected] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [eng, cor] = await Promise.all([
          apiFetch<Engine>('/v1/portfolio/engine'),
          apiFetch<{
            corridors: Corridor[];
            total?: number;
            countries?: CountryRow[];
            countries_covered?: number;
            country_pack_total?: number;
            note?: string;
          }>('/v1/portfolio/corridors'),
        ]);
        setEngine(eng);
        setCorridors(cor.corridors);
        setCountries(cor.countries ?? []);
        setTotal(cor.total ?? cor.corridors.length);
        setCountriesCovered(cor.countries_covered ?? eng.countries_covered ?? 0);
        setCountryPackTotal(cor.country_pack_total ?? eng.country_pack_total ?? 0);
        const preferred =
          cor.corridors.find((c) => c.varietyId === 'ak-GH-twi') ??
          cor.corridors.find((c) => c.id === 'twi-english') ??
          cor.corridors[0];
        if (preferred) setSelected(preferred.id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      }
    })();
  }, []);

  const filteredCorridors = useMemo(() => {
    if (!countryFilter) return corridors;
    const needle = countryFilter.toLowerCase();
    return corridors.filter(
      (c) =>
        c.countryCode?.toLowerCase() === needle ||
        c.countryName?.toLowerCase() === needle ||
        (c.countryName?.toLowerCase().includes(needle) ?? false),
    );
  }, [corridors, countryFilter]);

  const selectedCorridor = filteredCorridors.find((c) => c.id === selected) ?? null;
  const listed = selectedCorridor
    ? [selectedCorridor]
    : filteredCorridors
        .filter((c) => c.evaluated)
        .concat(filteredCorridors.filter((c) => !c.evaluated).slice(0, 24));

  const countryOptions = useMemo(
    () => [
      { value: '', label: 'All countries', keywords: 'worldwide full catalog' },
      ...countries.map((c) => ({
        value: c.code,
        label: `${c.nameEn} (${c.code}) · ${c.corridorCount} corridor${c.corridorCount === 1 ? '' : 's'}`,
        keywords: `${c.code} ${c.nameEn} ${c.region}`,
        group: c.region,
      })),
    ],
    [countries],
  );

  return (
    <PortfolioShell
      title={engine?.product ?? 'Lugemi Verified Interpreter'}
      lede={
        engine?.note ??
        'Mix + Fidelity + Live for meaning-preserving interpretation with verification and repair. Full country-pack catalog available; evaluation depth varies.'
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
          Corridors ({total || corridors.length} language↔English · {countriesCovered || countries.length} /{' '}
          {countryPackTotal || countries.length} countries)
        </h2>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.45 }}>
          Full country-pack catalog. Search or filter by country. Evaluation depth varies — only design-partner
          varieties are marked evaluated.
        </p>
        <div
          style={{
            marginTop: '0.65rem',
            display: 'grid',
            gap: '0.65rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
            maxWidth: '40rem',
          }}
        >
          <SearchableCombobox
            value={countryFilter}
            onChange={(v) => {
              setCountryFilter(v);
              setSelected('');
            }}
            options={countryOptions}
            placeholder="Filter by country…"
            emptyLabel="All countries"
            aria-label="Filter corridors by country"
          />
          <SearchableCombobox
            value={selected}
            onChange={setSelected}
            options={filteredCorridors.map((c) => ({
              value: c.id,
              label: `${c.label}${c.evaluated ? ' · evaluated' : ''}`,
              keywords: `${c.id} ${c.varietyId} ${c.languageCode ?? ''} ${c.countryCode ?? ''} ${c.countryName ?? ''} ${c.region ?? ''}`,
              group: c.countryName ?? c.region ?? 'Corridors',
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
                {c.evaluated ? ' · evaluated' : ' · catalog (not yet evaluated)'}
              </span>
            </li>
          ))}
        </ul>
        {filteredCorridors.length === 0 ? (
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
            No non-English language↔English corridors for this country yet (English working language or no locale
            packs seeded). The country remains in the full pack catalog.
          </p>
        ) : null}
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

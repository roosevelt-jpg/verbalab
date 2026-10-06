'use client';

import { CSSProperties, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type CountryPack = {
  code: string;
  nameEn: string;
  region: string | null;
  currencyCode: string | null;
  primaryLanguages: string[];
  bcp47Tags: string[];
  relatedDialectCodes: string[];
  relatedAccentCodes: string[];
  culturalNotes: string | null;
  currencyNotes: string | null;
};

type Detail = CountryPack & {
  dateNotes?: string | null;
  numberNotes?: string | null;
  localePacks?: { languageCode: string; bcp47: string | null; currencyCode: string | null }[];
  note?: string;
};

export function CountriesClient() {
  const [packs, setPacks] = useState<CountryPack[]>([]);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [region, setRegion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = region.trim() ? `?region=${encodeURIComponent(region.trim())}` : '';
    const res = await apiFetch<{ data: CountryPack[] }>(`/v1/country-packs${q}`);
    setPacks(res.data);
  }, [region]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function openPack(code: string) {
    setError(null);
    try {
      setSelected(
        await apiFetch<Detail>(`/v1/country-packs/${encodeURIComponent(code)}?includeLocales=true`),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pack');
    }
  }

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
        Country packs
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '42rem' }}>
        ISO country guidance that composes language locale packs. Curated African-priority set — not a CLDR dump
        or billing SKU catalog.
      </p>

      <label className="vl-label" style={{ marginBottom: '1rem', display: 'grid', maxWidth: '20rem' }}>
        Region filter
        <input
          className="vl-field"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="e.g. East Africa"
        />
      </label>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <ul style={{ margin: '0 0 1.75rem', padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
        {packs.map((p) => (
          <li key={p.code} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
            <button
              type="button"
              onClick={() => void openPack(p.code)}
              style={{
                background: 'none',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
              }}
            >
              <strong>{p.code}</strong> · {p.nameEn}
              {p.region ? ` · ${p.region}` : ''}
              {p.currencyCode ? ` · ${p.currencyCode}` : ''}
            </button>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              {p.primaryLanguages.join(', ')} · {p.bcp47Tags.join(', ')}
            </div>
          </li>
        ))}
      </ul>

      {selected ? (
        <section>
          <h2 style={label}>
            {selected.code} · {selected.nameEn}
          </h2>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)' }}>{selected.culturalNotes}</p>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            {selected.currencyNotes} · {selected.dateNotes}
          </p>
          {selected.relatedDialectCodes.length > 0 ? (
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.9rem' }}>
              Dialects: {selected.relatedDialectCodes.join(', ')}
            </p>
          ) : null}
          {selected.relatedAccentCodes.length > 0 ? (
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.9rem' }}>
              Accents: {selected.relatedAccentCodes.join(', ')}
            </p>
          ) : null}
          {selected.localePacks && selected.localePacks.length > 0 ? (
            <div style={{ marginTop: '0.75rem' }}>
              <h3 style={label}>Linked language locale packs</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.35rem' }}>
                {selected.localePacks.map((lp) => (
                  <li key={lp.languageCode} style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                    {lp.languageCode} · {lp.bcp47 ?? '—'} · {lp.currencyCode ?? '—'}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {selected.note ? (
            <p style={{ margin: '0.75rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>{selected.note}</p>
          ) : null}
        </section>
      ) : null}
    </AppShell>
  );
}

const label: CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

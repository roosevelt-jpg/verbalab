'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type LocalePack = {
  languageCode: string;
  bcp47: string | null;
  dateNotes: string | null;
  numberNotes: string | null;
  currencyCode: string | null;
  currencyNotes: string | null;
  honorifics: Array<{ form: string; usage: string; notes?: string }>;
  doNotTranslate: string[];
  culturalNotes: string | null;
  language: {
    name: string;
    nativeName: string | null;
    tier: string;
  } | null;
};

type Examples = {
  languageCode: string;
  bcp47: string;
  date: string;
  number: string;
  currency: string | null;
};

export function LocalesClient {
  const [rows, setRows] = useState<LocalePack[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [examples, setExamples] = useState<Examples | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect( => {
    void fetch(`${API_URL}/v1/locales`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json) as { data: LocalePack[] };
        setRows(body.data);
        if (body.data[0]) setSelected(body.data[0].languageCode);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect( => {
    if (!selected) return;
    void fetch(`${API_URL}/v1/locales/${selected}/examples`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setExamples((await res.json) as Examples);
      })
      .catch( => setExamples(null));
  }, [selected]);

  const pack = rows.find((r) => r.languageCode === selected) ?? null;

  return (
    <AppShell>
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Locale packs</h1>
        <p style={{ color: '#555', marginBottom: '1.5rem', lineHeight: 1.55 }}>
          Date/number/currency notes, honorifics, and do-not-translate entities for registry languages.
          This is a curated pack — not a cultural intelligence platform.{' '}
          <Link href="/coverage" style={{ color: 'inherit' }}>
            Coverage
          </Link>{' '}
          measures MT quality separately.
        </p>

        {error ? (
          <p style={{ color: '#b00020' }} role="alert">
            {error}
          </p>
        ) : null}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {rows.map((row) => (
            <button
              key={row.languageCode}
              type="button"
              onClick={ => setSelected(row.languageCode)}
              style={{
                padding: '0.4rem 0.75rem',
                border: '1px solid #111',
                background: selected === row.languageCode ? '#111' : '#fff',
                color: selected === row.languageCode ? '#fff' : '#111',
                cursor: 'pointer',
              }}
            >
              {row.languageCode}
            </button>
          ))}
        </div>

        {pack ? (
          <section style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                {pack.language?.name ?? pack.languageCode}{' '}
                <span style={{ fontWeight: 400, color: '#666' }}>
                  ({pack.bcp47}
                  {pack.language?.tier ? ` · ${pack.language.tier}` : ''})
                </span>
              </h2>
              <p style={{ color: '#555', lineHeight: 1.55, margin: 0 }}>{pack.culturalNotes}</p>
            </div>

            {examples ? (
              <div
                style={{
                  padding: '0.9rem 1rem',
                  background: '#f6f6f6',
                  display: 'grid',
                  gap: '0.35rem',
                }}
              >
                <strong>Intl examples</strong>
                <div>Date: {examples.date}</div>
                <div>Number: {examples.number}</div>
                <div>Currency: {examples.currency ?? '—'}</div>
              </div>
            ) : null}

            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>Date / number / currency</h3>
              <p style={{ color: '#555', margin: '0 0 0.35rem', lineHeight: 1.5 }}>{pack.dateNotes}</p>
              <p style={{ color: '#555', margin: '0 0 0.35rem', lineHeight: 1.5 }}>{pack.numberNotes}</p>
              <p style={{ color: '#555', margin: 0, lineHeight: 1.5 }}>
                {pack.currencyCode}: {pack.currencyNotes}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>Honorifics</h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#444' }}>
                {pack.honorifics.map((h) => (
                  <li key={`${h.form}-${h.usage}`}>
                    <strong>{h.form}</strong> — {h.usage}
                    {h.notes ? ` (${h.notes})` : ''}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>Do not translate</h3>
              <p style={{ color: '#555', margin: 0 }}>{pack.doNotTranslate.join(' · ') || '—'}</p>
            </div>
          </section>
        ) : (
          <p style={{ color: '#666' }}>Loading locale packs…</p>
        )}
      </main>
    </AppShell>
  );
}

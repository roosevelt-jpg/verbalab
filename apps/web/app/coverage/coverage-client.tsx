'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';

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

export function CoverageClient() {
  const [data, setData] = useState<CoveragePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${API_URL}/v1/coverage`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Coverage HTTP ${res.status}`);
        setData((await res.json()) as CoveragePayload);
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

      <h1 style={{ margin: '1.75rem 0 0', fontFamily: 'var(--font-ui)', letterSpacing: '-0.03em', fontSize: '2.35rem' }}>
        Language coverage
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '40rem' }}>
        Africa-first is the product investment priority. This page reports the language registry and measured
        translation goldens — not a claim that every language or task is available.
      </p>

      {error ? (
        <p style={{ color: 'var(--bad)' }}>
          Could not load coverage ({error}). The API may be offline. Public docs remain at{' '}
          <Link href="/docs">/docs</Link>.
        </p>
      ) : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading coverage…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <p className="vl-panel" style={{ margin: 0, padding: '1.1rem 1.25rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            {data.disclaimer} {data.note}
          </p>

          <div className="vl-panel" style={{ padding: '1.35rem' }}>
            <h2 style={{ marginTop: 0, fontFamily: 'var(--font-ui)', fontSize: '1.25rem', fontWeight: 600 }}>
              Registry
            </h2>
            <p style={{ color: 'var(--muted)', marginTop: 0 }}>
              {data.languages.total} languages in the core registry, including {data.languages.strategicAfrican}{' '}
              strategic African entries. Registry membership is not the same as transcription, speech, or dubbing
              availability.
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

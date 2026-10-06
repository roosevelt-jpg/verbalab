'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };
type Engine = { product: string; note: string; capabilities: Capability[] };
type Analytics = {
  windowDays: number;
  detects: number;
  classifies: number;
  total: number;
  byAccent: Record<string, number>;
  registryProfiles: number;
};
type Classification = {
  accent: string | null;
  accentName: string | null;
  confidence: number;
  classification: {
    confidenceBand: string;
    ranked: Array<{ rank: number; code: string; nameEn: string; score: number }>;
  };
  note: string;
};

export function AccentIntelligenceClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [text, setText] = useState('How far na, I dey go market for Lagos.');
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState<Classification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, stats] = await Promise.all([
      apiFetch<Engine>('/v1/accents/engine', { token }),
      apiFetch<Analytics>('/v1/accents/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(stats);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function onClassify(e: FormEvent) {
    e.preventDefault;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<Classification>('/v1/accents/classify', {
        token,
        method: 'POST',
        body: JSON.stringify({ text, language: language || undefined }),
      });
      setResult(body);
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classify failed');
    } finally {
      setLoading(false);
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
        Accent Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Cue-based accent detection and classification with confidence and analytics. Dialects live in{' '}
        <Link href="/dialects">Language Cloud</Link>. Registry at <Link href="/accents">/accents</Link>.
        Not acoustic regional models.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Last {analytics.windowDays}d: {analytics.detects} detects · {analytics.classifies} classifies ·{' '}
          {analytics.registryProfiles} profiles
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Classify</h2>
          <form onSubmit={(e) => void onClassify(e)} style={{ display: 'grid', gap: '0.65rem' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              style={{ ...input, resize: 'vertical' }}
            />
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Language hint (en)"
              style={input}
            />
            <button type="submit" disabled={loading || !text.trim} style={primary}>
              Classify accent
            </button>
          </form>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {result.accentName ?? 'No accent'} ({result.accent ?? '—'}) · confidence{' '}
              {result.confidence} · band {result.classification.confidenceBand}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {result.note}
            </p>
            <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
              {result.classification.ranked.map((r) => (
                <li key={r.code} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  #{r.rank} {r.nameEn} · {r.score}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {engine ? (
          <section>
            <h2 style={label}>Engine capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.45rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>· {c.status}</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const input: React.CSSProperties = {
  padding: '0.55rem 0.7rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontSize: '0.95rem',
};

const primary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  width: 'fit-content',
};

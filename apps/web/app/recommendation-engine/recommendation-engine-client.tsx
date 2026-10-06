'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
  honesty: { retailRecommenderOs: boolean; lightRankers: boolean };
};
type Analytics = { requests: number; note: string };
type Item = { id: string; title: string; score: number; reason: string; kind: string };

export function RecommendationEngineClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [kind, setKind] = useState('language');
  const [query, setQuery] = useState('Swahili');
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, an] = await Promise.all([
      apiFetch<Engine>('/v1/recommendation-engine/engine', { token }),
      apiFetch<Analytics>('/v1/recommendation-engine/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function recommend() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{ items: Item[] }>('/v1/recommendation-engine/recommend', {
        token,
        method: 'POST',
        body: { kind, query, k: 8, useVectors: kind === 'content' || kind === 'knowledge' },
      });
      setItems(body.items);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recommend failed');
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
        Recommendation Engine
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Light rankers over languages, voices, and knowledge — not a retail recommender OS.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> ·{' '}
        <Link href="/embedding-cloud">Embeddings</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.requests} recommend calls this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Recommend</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="language">language</option>
              <option value="voice">voice</option>
              <option value="content">content</option>
              <option value="knowledge">knowledge</option>
              <option value="translation">translation</option>
              <option value="model">model</option>
              <option value="workflow">workflow</option>
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query"
              style={{
                flex: 1,
                minWidth: '12rem',
                padding: '0.55rem',
                border: '1px solid var(--line)',
                borderRadius: '0.4rem',
              }}
            />
            <button type="button" disabled={loading} style={primary} onClick={() => void recommend()}>
              Rank
            </button>
          </div>
          <ul style={{ margin: '1rem 0 0', padding: 0, listStyle: 'none' }}>
            {items.map((item) => (
              <li key={item.id} style={{ borderTop: '1px solid var(--line)', padding: '0.45rem 0' }}>
                <strong>{item.title}</strong>{' '}
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  · {item.score.toFixed(2)} · {item.reason}
                </span>
              </li>
            ))}
            {items.length === 0 ? (
              <li style={{ color: 'var(--muted)' }}>No results yet — run a rank.</li>
            ) : null}
          </ul>
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note} Retail OS {engine.honesty.retailRecommenderOs ? 'yes' : 'no'} · light
              rankers {engine.honesty.lightRankers ? 'yes' : 'no'}.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{c.name}</strong>{' '}
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

const primary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

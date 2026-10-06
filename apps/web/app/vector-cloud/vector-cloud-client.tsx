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
  honesty: { managedVectorDbOs: boolean; pineconeParity: boolean; hybridBm25: boolean };
};
type Collections = {
  collections: Array<{
    id: string;
    name: string;
    namespace: string;
    backend: string;
    documentCount: number;
    vectorCount: number;
    status: string;
  }>;
  note: string;
};
type Analytics = {
  searchRequests: number;
  vectors: number;
  readyDocuments: number;
  note: string;
};

export function VectorCloudClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [collections, setCollections] = useState<Collections | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [query, setQuery] = useState('Where is Lugemi HQ?');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, cols, an] = await Promise.all([
      apiFetch<Engine>('/v1/vector-cloud/engine', { token }),
      apiFetch<Collections>('/v1/vector-cloud/collections', { token }),
      apiFetch<Analytics>('/v1/vector-cloud/analytics', { token }),
    ]);
    setEngine(eng);
    setCollections(cols);
    setAnalytics(an);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function search {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{
        query: string;
        collection: string;
        backend: string;
        hits: Array<{ rank: number; filename: string; score: number; content: string }>;
        note: string;
      }>('/v1/vector-cloud/search', {
        token,
        method: 'POST',
        body: { query, k: 5 },
      });
      setResult(
        JSON.stringify(
          {
            query: body.query,
            collection: body.collection,
            backend: body.backend,
            hits: body.hits.map((h) => ({
              rank: h.rank,
              filename: h.filename,
              score: h.score,
              preview: h.content.slice(0, 160),
            })),
            note: body.note,
          },
          null,
          2,
        ),
      );
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
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
        Vector Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Nearest-neighbor search over Postgres pgvector knowledge chunks. Not a Pinecone OS.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> ·{' '}
        <Link href="/embedding-cloud">Embeddings</Link> · <Link href="/knowledge">Knowledge / RAG</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.searchRequests} searches · {analytics.vectors} vectors · {analytics.readyDocuments}{' '}
          ready docs this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Try search</h2>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.65rem',
              border: '1px solid var(--line)',
              borderRadius: '0.4rem',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ marginTop: '0.65rem' }}>
            <button type="button" disabled={loading} style={primary} onClick={ => void search}>
              Search vectors
            </button>
          </div>
          {result ? <pre style={pre}>{result}</pre> : null}
        </section>

        {collections ? (
          <section>
            <h2 style={label}>Collections</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {collections.note}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {collections.collections.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    · {c.backend} · {c.documentCount} docs · {c.vectorCount} vectors
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
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

const pre: React.CSSProperties = {
  margin: '0.75rem 0 0',
  padding: '0.85rem',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
};

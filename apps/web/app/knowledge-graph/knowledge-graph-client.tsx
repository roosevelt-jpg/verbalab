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
  honesty: { neo4jParity: boolean; ontologyPlatform: boolean; preferRag: boolean };
};
type Analytics = { entities: number; relationships: number; note: string };
type Entity = { id: string; name: string; type: string; domain: string; description: string };

export function KnowledgeGraphClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [nameA, setNameA] = useState('VerbaLab');
  const [nameB, setNameB] = useState('Nairobi');
  const [relType, setRelType] = useState('headquartered_in');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, an, list] = await Promise.all([
      apiFetch<Engine>('/v1/knowledge-graph/engine', { token }),
      apiFetch<Analytics>('/v1/knowledge-graph/analytics', { token }),
      apiFetch<{ data: Entity[] }>('/v1/knowledge-graph/entities?limit=20', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
    setEntities(list.data);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function addLinkedPair() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const a = await apiFetch<Entity>('/v1/knowledge-graph/entities', {
        token,
        method: 'POST',
        body: { name: nameA, type: 'organization', domain: 'general' },
      });
      const b = await apiFetch<Entity>('/v1/knowledge-graph/entities', {
        token,
        method: 'POST',
        body: { name: nameB, type: 'place', domain: 'general' },
      });
      const edge = await apiFetch<{ id: string; type: string }>('/v1/knowledge-graph/relationships', {
        token,
        method: 'POST',
        body: { fromEntityId: a.id, toEntityId: b.id, type: relType, label: relType },
      });
      const neighborhood = await apiFetch<unknown>(
        `/v1/knowledge-graph/entities/${a.id}/neighborhood`,
        { token },
      );
      setResult(JSON.stringify({ a, b, edge, neighborhood }, null, 2));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Graph write failed');
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
        Knowledge Graph
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Bounded entity/relationship layer in Postgres. Prefer{' '}
        <Link href="/knowledge">Knowledge / RAG</Link> for answers — not Neo4j.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.entities} entities · {analytics.relationships} relationships
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Add linked entities</h2>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <input
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
              placeholder="From entity"
              style={input}
            />
            <input
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
              placeholder="Relationship type"
              style={input}
            />
            <input
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
              placeholder="To entity"
              style={input}
            />
            <button type="button" disabled={loading} style={primary} onClick={() => void addLinkedPair()}>
              Create edge
            </button>
          </div>
          {result ? <pre style={pre}>{result}</pre> : null}
        </section>

        <section>
          <h2 style={label}>Entities</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {entities.map((e) => (
              <li key={e.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                <strong>{e.name}</strong>{' '}
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  · {e.type} · {e.domain}
                </span>
                {e.description ? (
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{e.description}</div>
                ) : null}
              </li>
            ))}
            {entities.length === 0 ? (
              <li style={{ color: 'var(--muted)' }}>No entities yet.</li>
            ) : null}
          </ul>
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note} Neo4j parity {engine.honesty.neo4jParity ? 'yes' : 'no'} · prefer RAG{' '}
              {engine.honesty.preferRag ? 'yes' : 'no'}.
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

const input: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  fontFamily: 'inherit',
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
  justifySelf: 'start',
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

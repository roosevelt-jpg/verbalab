'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: {
    biOs: boolean;
    regeneratesIntelligenceAnalytics: boolean;
    orgWorkspaceScoped: boolean;
    extendsKnowledgeCloud: boolean;
  };
};

type Insight = {
  documents: number;
  ready: number;
  failed: number;
  chunks: number;
  taxonomyTerms: number;
  ontologyConcepts: number;
  knowledgeMemories: number;
};

type Discover = {
  documents: Array<{ id: string; filename: string; status: string }>;
  taxonomyTerms: Array<{ name: string; slug: string }>;
  ontologyConcepts: Array<{ name: string; type: string }>;
};

export function KnowledgeIntelligenceClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [discover, setDiscover] = useState<Discover | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, ins] = await Promise.all([
      apiFetch<Engine>('/v1/knowledge-intelligence/engine', { token }),
      apiFetch<Insight>('/v1/knowledge-intelligence/insight', { token }),
    ]);
    setEngine(eng);
    setInsight(ins);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const runDiscover = useCallback(async  => {
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<Discover>('/v1/knowledge-intelligence/discover', {
        token,
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      setDiscover(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discover failed');
    }
  }, [getToken, query]);

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
        Knowledge Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Combined discovery, linking, validation, and confidence over the Knowledge Cloud. Heuristic
        insight — not a BI / Palantir OS. Distinct from{' '}
        <Link href="/intelligence-analytics">Intelligence Analytics</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {insight ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Docs {insight.documents} ({insight.ready} ready / {insight.failed} failed) · Chunks{' '}
          {insight.chunks} · Terms {insight.taxonomyTerms} · Concepts {insight.ontologyConcepts} ·
          KM {insight.knowledgeMemories}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Discover query"
          style={{ ...input, minWidth: '16rem', flex: 1 }}
        />
        <button type="button" onClick={ => void runDiscover} disabled={!query.trim} style={btn}>
          Discover
        </button>
      </div>

      {discover ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            Docs {discover.documents.length} · Terms {discover.taxonomyTerms.length} · Concepts{' '}
            {discover.ontologyConcepts.length}
          </p>
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--muted)' }}>
            {discover.documents.slice(0, 5).map((d) => (
              <li key={d.id}>
                {d.filename} · {d.status}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Honesty: biOs={String(engine.honesty.biOs)} · regeneratesIntelligenceAnalytics=
            {String(engine.honesty.regeneratesIntelligenceAnalytics)} · orgWorkspaceScoped=
            {String(engine.honesty.orgWorkspaceScoped)}
          </p>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.45rem' }}>
                <strong>{c.name}</strong> · {c.status}
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/knowledge-cloud">Knowledge Cloud</Link>
        {' · '}
        <Link href="/knowledge-base">Knowledge Base</Link>
        {' · '}
        <Link href="/enterprise-search">Enterprise Search</Link>
      </p>
    </AppShell>
  );
}

const input: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.75rem',
  background: 'var(--surface)',
  color: 'inherit',
  font: 'inherit',
};

const btn: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  background: 'var(--fg)',
  color: 'var(--bg)',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
};

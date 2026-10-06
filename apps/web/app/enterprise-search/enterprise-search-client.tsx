'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = {
  id: string;
  name: string;
  status: string;
  notes: string;
};

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: {
    elasticOs: boolean;
    bm25Parity: boolean;
    imageSearch: boolean;
    voiceSearch: boolean;
    orgWorkspaceScoped: boolean;
    extendsVl062: boolean;
  };
};

type Hit = {
  rank: number;
  filename: string;
  score: number;
  content: string;
  source: string;
};

export function EnterpriseSearchClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [query, setQuery] = useState('leave policy');
  const [mode, setMode] = useState<'keyword' | 'semantic' | 'hybrid'>('hybrid');
  const [hits, setHits] = useState<Hit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect( => {
    if (!isLoaded) return;
    void (async  => {
      try {
        const token = await getToken;
        if (!token) throw new Error('Not signed in');
        setEngine(await apiFetch<Engine>('/v1/enterprise-search/engine', { token }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    });
  }, [isLoaded, getToken]);

  const runSearch = useCallback(async  => {
    setSearching(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ hits: Hit[] }>('/v1/enterprise-search/search', {
        token,
        method: 'POST',
        body: JSON.stringify({ query, mode, k: 8 }),
      });
      setHits(res.hits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [getToken, query, mode]);

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
        Enterprise Search
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Keyword, semantic, and light hybrid search over the Knowledge Base. Not Elastic/OpenSearch
        OS. Ingest docs on <Link href="/knowledge">Knowledge / RAG</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.75rem', maxWidth: '36rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search query"
          style={input}
        />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          style={input}
        >
          <option value="hybrid">hybrid (light RRF)</option>
          <option value="keyword">keyword</option>
          <option value="semantic">semantic</option>
        </select>
        <button type="button" onClick={ => void runSearch} disabled={searching} style={btn}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {hits.length > 0 ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={label}>Results</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {hits.map((h) => (
              <li key={`${h.rank}-${h.filename}`} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                <strong>
                  #{h.rank} {h.filename}
                </strong>{' '}
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  · {h.source} · score {h.score.toFixed(3)}
                </span>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {h.content.slice(0, 220)}
                  {h.content.length > 220 ? '…' : ''}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
          <section>
            <h2 style={label}>Honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Org/workspace scoped {engine.honesty.orgWorkspaceScoped ? 'yes' : 'no'} · Extends prior
               {engine.honesty.extendsVl062 ? 'yes' : 'no'} · Elastic OS{' '}
              {engine.honesty.elasticOs ? 'yes' : 'no'} · BM25 parity{' '}
              {engine.honesty.bm25Parity ? 'yes' : 'no'} · Image{' '}
              {engine.honesty.imageSearch ? 'yes' : 'no'} · Voice{' '}
              {engine.honesty.voiceSearch ? 'yes' : 'no'}
            </p>
          </section>
          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/knowledge-base" style={secondary}>
                Knowledge Base
              </Link>
              <Link href="/knowledge-cloud" style={secondary}>
                Knowledge Cloud
              </Link>
              <Link href="/vector-cloud" style={secondary}>
                Vector Cloud
              </Link>
            </div>
          </section>
          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>· {c.status}</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
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

const secondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.45rem 0.75rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  color: 'var(--ink)',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
};

const input: React.CSSProperties = {
  padding: '0.55rem 0.75rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  fontSize: '0.95rem',
  background: 'transparent',
  color: 'var(--ink)',
};

const btn: React.CSSProperties = {
  padding: '0.55rem 0.9rem',
  border: '1px solid var(--ink)',
  borderRadius: '0.4rem',
  background: 'var(--ink)',
  color: 'var(--paper, #fff)',
  fontWeight: 600,
  cursor: 'pointer',
  width: 'fit-content',
};

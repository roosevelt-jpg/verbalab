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
    langchainOs: boolean;
    agenticRagOs: boolean;
    orgWorkspaceScoped: boolean;
    extendsVl062: boolean;
    handVerifyRequired: boolean;
  };
};

type Analytics = {
  documents: number;
  chunks: number;
  retrievesLast30d: number;
  queriesLast30d: number;
};

type RetrieveResult = {
  passages: Array<{ rank: number; filename: string; content: string; score: number }>;
  citations: Array<{ index: number; filename: string; snippet: string }>;
  context: { passageCount: number; truncated: boolean; totalChars: number };
};

export function EnterpriseRagClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('hybrid');
  const [result, setResult] = useState<RetrieveResult | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/enterprise-rag/engine', { token }),
      apiFetch<Analytics>('/v1/enterprise-rag/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const retrieve = useCallback(async () => {
    setError(null);
    setAnswer(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<RetrieveResult>('/v1/enterprise-rag/retrieve', {
        token,
        method: 'POST',
        body: JSON.stringify({ query, mode }),
      });
      setResult(res);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retrieve failed');
    }
  }, [getToken, query, mode, load]);

  const ask = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        answer: string;
        citations: Array<{ index: number; filename: string; snippet: string }>;
        context: RetrieveResult['context'];
      }>('/v1/enterprise-rag/query', {
        token,
        method: 'POST',
        body: JSON.stringify({ question: query, mode }),
      });
      setAnswer(res.answer);
      setResult({
        passages: [],
        citations: res.citations,
        context: res.context,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    }
  }, [getToken, query, mode, load]);

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
        Enterprise RAG
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Grounded answers over the{' '}
        <Link href="/knowledge-base">Knowledge Base</Link> with citations and hybrid retrieval.
        Extends existing. Not a LangChain / agentic RAG OS — hand-check retrieved context on real
        docs.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Question or retrieval query"
          style={{ ...input, minWidth: '16rem', flex: 1 }}
        />
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={input}>
          <option value="hybrid">hybrid</option>
          <option value="semantic">semantic</option>
          <option value="keyword">keyword</option>
        </select>
        <button type="button" onClick={() => void retrieve()} disabled={!query.trim()} style={btn}>
          Retrieve
        </button>
        <button type="button" onClick={() => void ask()} disabled={!query.trim()} style={btn}>
          Ask (grounded)
        </button>
      </div>

      {analytics ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Docs {analytics.documents} · Chunks {analytics.chunks} · Retrieves{' '}
          {analytics.retrievesLast30d} · Queries {analytics.queriesLast30d}
        </p>
      ) : null}

      {answer ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Answer</h2>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', maxWidth: '48rem' }}>{answer}</p>
        </div>
      ) : null}

      {result?.citations?.length ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Citations</h2>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {result.citations.map((c) => (
              <li key={c.index} style={{ marginBottom: '0.4rem', color: 'var(--muted)' }}>
                [{c.index}] {c.filename} — {c.snippet}
              </li>
            ))}
          </ul>
          {result.context ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Context: {result.context.passageCount} passages · {result.context.totalChars} chars
              {result.context.truncated ? ' · truncated' : ''}
            </p>
          ) : null}
        </div>
      ) : null}

      {result?.passages?.length ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Passages</h2>
          {result.passages.map((p) => (
            <div key={p.rank} style={{ marginBottom: '0.85rem' }}>
              <strong>
                #{p.rank} {p.filename}
              </strong>{' '}
              <span style={{ color: 'var(--muted)' }}>({p.score.toFixed(3)})</span>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                {p.content.slice(0, 320)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Honesty: langchainOs={String(engine.honesty.langchainOs)} · agenticRagOs=
            {String(engine.honesty.agenticRagOs)} · orgWorkspaceScoped=
            {String(engine.honesty.orgWorkspaceScoped)} · handVerifyRequired=
            {String(engine.honesty.handVerifyRequired)}
          </p>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.45rem' }}>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/knowledge-cloud">Knowledge Cloud</Link>
        {' · '}
        <Link href="/enterprise-search">Enterprise Search</Link>
        {' · '}
        <Link href="/knowledge"> Knowledge</Link>
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

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
  honesty: { infiniteContextWindow: boolean; llmSummarization: boolean; realtimePush: boolean };
};
type Analytics = { assemblies: number; note: string };

export function ContextEngineClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [query, setQuery] = useState('Where is Lugemi HQ?');
  const [maxChars, setMaxChars] = useState(4000);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, an] = await Promise.all([
      apiFetch<Engine>('/v1/context-engine/engine', { token }),
      apiFetch<Analytics>('/v1/context-engine/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function assemble {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{
        included: string[];
        promptContext: string;
        compression: {
          maxChars: number;
          beforeChars: number;
          afterChars: number;
          truncated: boolean;
        };
        note: string;
      }>('/v1/context-engine/assemble', {
        token,
        method: 'POST',
        body: { query, maxChars, promptKey: 'rag' },
      });
      setResult(
        JSON.stringify(
          {
            included: body.included,
            compression: body.compression,
            promptContextPreview: body.promptContext.slice(0, 1200),
            note: body.note,
          },
          null,
          2,
        ),
      );
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assemble failed');
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
        Context Engine
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Assemble retrieval, memory, language, and prompt context for AI requests. Not an infinite
        window.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> ·{' '}
        <Link href="/memory-cloud">Memory</Link> · <Link href="/vector-cloud">Vectors</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.assemblies} assemblies this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Assemble</h2>
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
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.65rem', alignItems: 'center' }}>
            <label style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              maxChars{' '}
              <input
                type="number"
                value={maxChars}
                onChange={(e) => setMaxChars(Number(e.target.value) || 4000)}
                style={{
                  width: '6rem',
                  marginLeft: '0.35rem',
                  padding: '0.35rem',
                  border: '1px solid var(--line)',
                  borderRadius: '0.35rem',
                }}
              />
            </label>
            <button type="button" disabled={loading} style={primary} onClick={ => void assemble}>
              Assemble context
            </button>
          </div>
          {result ? <pre style={pre}>{result}</pre> : null}
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note} Infinite window {engine.honesty.infiniteContextWindow ? 'yes' : 'no'} ·
              LLM summarization {engine.honesty.llmSummarization ? 'yes' : 'no'}.
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

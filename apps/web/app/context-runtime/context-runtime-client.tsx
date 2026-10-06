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
  mode: string;
  capabilities: Capability[];
  ceilings: { maxChars: number; cacheTtlSec: number };
  honesty: {
    infiniteContextWindow: boolean;
    llmSummarization: boolean;
    realtimePush: boolean;
    regeneratesContextEngine: boolean;
    extendsContextEngine: boolean;
  };
};

type Analytics = { assemblies: number };

export function ContextRuntimeClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [modelHint, setModelHint] = useState('gpt-sandbox');
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/context-runtime/engine', { token }),
      apiFetch<Analytics>('/v1/context-runtime/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const assemble = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        included: string[];
        compression: { afterChars: number; truncated: boolean };
        promptContext: string;
        cache: string;
      }>('/v1/context-runtime/assemble', {
        token,
        method: 'POST',
        body: JSON.stringify({
          query: query || undefined,
          modelHint,
          maxChars: 4000,
          useCache: true,
        }),
      });
      setResult(
        `included=${res.included.join(',')} · chars=${res.compression.afterChars} · truncated=${res.compression.truncated} · cache=${res.cache}\n\n${res.promptContext.slice(0, 500)}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assemble failed');
    }
  }, [getToken, query, modelHint, load]);

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
        Context Runtime
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Kernel assembly over the <Link href="/context-engine">Context Engine</Link> — prioritize,
        compress, retrieve. Char-budget only; not an infinite context window.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Optional retrieval query"
          style={{ ...input, minWidth: '14rem', flex: 1 }}
        />
        <input
          value={modelHint}
          onChange={(e) => setModelHint(e.target.value)}
          placeholder="model hint"
          style={input}
        />
        <button type="button" onClick={() => void assemble()} style={btn}>
          Assemble
        </button>
      </div>
      {result ? (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.85rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {result}
        </pre>
      ) : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Assemblies this month {analytics.assemblies}
          {engine ? ` · max ${engine.ceilings.maxChars} chars` : null}
        </p>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Mode: {engine.mode} · infiniteContextWindow=
            {String(engine.honesty.infiniteContextWindow)} · llmSummarization=
            {String(engine.honesty.llmSummarization)} · extendsContextEngine=
            {String(engine.honesty.extendsContextEngine)}
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
        <Link href="/ai-kernel">AI Kernel</Link>
        {' · '}
        <Link href="/context-engine">Context Engine</Link>
        {' · '}
        <Link href="/prompt-runtime">Prompt Runtime</Link>
        {' · '}
        <Link href="/memory-runtime">Memory Runtime</Link>
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

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
  ceilings: { maxHistoryPerWorkspace: number };
  honesty: {
    customReasonerKernel: boolean;
    toolExecution: boolean;
    regeneratesReasoningCloud: boolean;
    extendsReasoningCloud: boolean;
  };
};

type Analytics = { events: number; historyCount: number };

export function ReasoningRuntimeClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState('Plan a short translation QA checklist');
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/reasoning-runtime/engine', { token }),
      apiFetch<Analytics>('/v1/reasoning-runtime/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const plan = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        strategy: string;
        steps: string[];
        answer: string;
        historyId?: string;
      }>('/v1/reasoning-runtime/plan', {
        token,
        method: 'POST',
        body: JSON.stringify({ problem, sandboxOnly: true }),
      });
      setResult(
        `${res.strategy} · history=${res.historyId?.slice(0, 8) ?? 'n/a'}…\n${res.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan failed');
    }
  }, [getToken, problem, load]);

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
        Reasoning Runtime
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Kernel reasoning over <Link href="/reasoning-cloud">Reasoning Cloud</Link> — plan, reflect,
        evaluate, history. Suggests tools; does not execute them. Not a custom reasoner OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Problem to plan"
          style={{ ...input, minWidth: '16rem', flex: 1 }}
        />
        <button type="button" onClick={() => void plan()} disabled={!problem.trim()} style={btn}>
          Sandbox plan
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
          Events {analytics.events} · History {analytics.historyCount}
          {engine ? ` · max ${engine.ceilings.maxHistoryPerWorkspace}` : null}
        </p>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Mode: {engine.mode} · customReasonerKernel=
            {String(engine.honesty.customReasonerKernel)} · toolExecution=
            {String(engine.honesty.toolExecution)} · extendsReasoningCloud=
            {String(engine.honesty.extendsReasoningCloud)}
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
        <Link href="/ai-kernel">AI Kernel</Link>
        {' · '}
        <Link href="/reasoning-cloud">Reasoning Cloud</Link>
        {' · '}
        <Link href="/context-runtime">Context Runtime</Link>
        {' · '}
        <Link href="/decision-engine">Decisions</Link>
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

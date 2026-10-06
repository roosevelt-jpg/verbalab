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
  honesty: { customReasonerKernel: boolean; llmGateway: boolean; toolExecution: boolean };
};
type Analytics = { reasonRequests: number; chatTokens: number; note: string };

export function ReasoningCloudClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [problem, setProblem] = useState('Should we translate the FAQ into Swahili first or English?');
  const [strategy, setStrategy] = useState('chain_of_thought');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, an] = await Promise.all([
      apiFetch<Engine>('/v1/reasoning-cloud/engine', { token }),
      apiFetch<Analytics>('/v1/reasoning-cloud/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function reason() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{
        strategy: string;
        steps: string[];
        answer: string;
        provider: string;
        usage: { total_tokens: number; calls: number };
        note: string;
      }>('/v1/reasoning-cloud/reason', {
        token,
        method: 'POST',
        body: { problem, strategy, retrieve: true },
      });
      setResult(JSON.stringify(body, null, 2));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reason failed');
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
        Reasoning Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Multi-step reasoning via the AI Gateway — not a custom reasoner kernel.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> · <Link href="/chat">Chat</Link> ·{' '}
        <Link href="/context-engine">Context</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.reasonRequests} reason calls · {analytics.chatTokens} chat tokens this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Reason</h2>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '0.65rem',
              border: '1px solid var(--line)',
              borderRadius: '0.4rem',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.65rem', alignItems: 'center' }}>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="chain_of_thought">chain_of_thought</option>
              <option value="tree_of_thought">tree_of_thought</option>
              <option value="planning">planning</option>
              <option value="decision">decision</option>
              <option value="problem_solving">problem_solving</option>
              <option value="tool_selection">tool_selection</option>
              <option value="graph_reasoning">graph_reasoning</option>
              <option value="agent">agent</option>
            </select>
            <button type="button" disabled={loading} style={primary} onClick={() => void reason()}>
              Run reasoning
            </button>
          </div>
          {result ? <pre style={pre}>{result}</pre> : null}
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note} Custom kernel {engine.honesty.customReasonerKernel ? 'yes' : 'no'} · LLM
              gateway {engine.honesty.llmGateway ? 'yes' : 'no'}.
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

const pre: React.CSSProperties = {
  margin: '0.75rem 0 0',
  padding: '0.85rem',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
};

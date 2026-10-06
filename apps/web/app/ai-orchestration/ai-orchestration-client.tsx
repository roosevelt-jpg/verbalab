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
  honesty: { multiCloudAgentOs: boolean; loadBearingE2e: boolean };
};
type Analytics = { runs: number; note: string };
type RunResult = {
  pipeline: string;
  result: string;
  steps: Array<{ id: string; op: string; ok: boolean; durationMs: number }>;
};

export function AiOrchestrationClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pipeline, setPipeline] = useState('detect_translate');
  const [text, setText] = useState('Hello from Lugemi orchestration');
  const [target, setTarget] = useState('sw');
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, an] = await Promise.all([
      apiFetch<Engine>('/v1/ai-orchestration/engine', { token }),
      apiFetch<Analytics>('/v1/ai-orchestration/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function run {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<RunResult>('/v1/ai-orchestration/run', {
        token,
        method: 'POST',
        body: { pipeline, text, target },
      });
      setResult(body);
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
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
        AI Orchestration
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Load-bearing e2e pipelines over gateway/engines — not a multi-cloud agent OS.{' '}
        <Link href="/workflows">Workflows</Link> ·{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.runs} orchestration runs this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Run pipeline</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={pipeline}
              onChange={(e) => setPipeline(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="detect_translate">detect_translate</option>
              <option value="translate_chat">translate_chat</option>
              <option value="decide_act">decide_act</option>
              <option value="tool_chain">tool_chain</option>
              <option value="model_chain">model_chain</option>
              <option value="assemble_chat">assemble_chat</option>
            </select>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="target"
              style={{
                width: '4.5rem',
                padding: '0.45rem',
                borderRadius: '0.35rem',
                border: '1px solid var(--line)',
              }}
            />
            <button type="button" onClick={ => void run} disabled={loading} style={btn}>
              Run
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.65rem',
              borderRadius: '0.35rem',
              border: '1px solid var(--line)',
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: '0.85rem',
            }}
          />
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <p style={{ margin: '0 0 0.5rem' }}>
              {result.pipeline} · {result.steps.length} steps
            </p>
            <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.2rem', color: 'var(--muted)' }}>
              {result.steps.map((s) => (
                <li key={s.id}>
                  {s.id} ({s.op}) — {s.ok ? 'ok' : 'fail'} · {s.durationMs}ms
                </li>
              ))}
            </ul>
            <pre style={pre}>{result.result.slice(0, 2000)}</pre>
          </section>
        ) : null}

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id}>
                  {c.name} — {c.status}
                </li>
              ))}
            </ul>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
              multiCloudAgentOs={String(engine.honesty.multiCloudAgentOs)} · loadBearingE2e=
              {String(engine.honesty.loadBearingE2e)}
            </p>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const btn: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  borderRadius: '0.35rem',
  border: '1px solid var(--line)',
  background: 'var(--fg)',
  color: 'var(--bg)',
  fontWeight: 600,
  cursor: 'pointer',
};

const pre: React.CSSProperties = {
  margin: 0,
  padding: '0.85rem',
  borderRadius: '0.35rem',
  border: '1px solid var(--line)',
  whiteSpace: 'pre-wrap',
  fontSize: '0.82rem',
  lineHeight: 1.45,
  maxHeight: '16rem',
  overflow: 'auto',
};

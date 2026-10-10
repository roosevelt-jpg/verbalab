'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  honesty: {
    sparkOs: boolean;
    airflowOs: boolean;
    regeneratesJobsApi: boolean;
    extendsBullMqJobs: boolean;
    distributedBatchOs: boolean;
  };
  ceilings: { maxItemsPerRun: number; maxRetries: number; mode: string };
  spendSafety: { note: string };
};

type Kind = { id: string; name: string; status: string; notes: string };

type Run = {
  id: string;
  kind: string;
  priority: string;
  status: string;
  itemCount: number;
  checkpointIndex: number;
  jobId: string | null;
};

export function BatchRuntimeClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, kindsRes, runsRes] = await Promise.all([
      apiFetch<Engine>('/v1/batch-runtime/engine', { token }),
      apiFetch<{ kinds: Kind[] }>('/v1/batch-runtime/kinds', { token }),
      apiFetch<{ runs: Run[] }>('/v1/batch-runtime/runs', { token }),
    ]);
    setEngine(eng);
    setKinds(kindsRes.kinds);
    setRuns(runsRes.runs);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const createSandbox = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/batch-runtime/runs', {
        token,
        method: 'POST',
        body: JSON.stringify({
          kind: 'embedding',
          priority: 'high',
          items: ['alpha', 'beta', 'gamma'],
          label: 'console',
        }),
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

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
        Batch Runtime
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Batch hub over BullMQ jobs with sandbox priority/retry/checkpoint. Not a distributed batch OS.{' '}
        <Link href="/inference-cloud">Inference Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {engine ? (
        <section
          style={{
            borderLeft: '3px solid #b45309',
            paddingLeft: '0.85rem',
            marginBottom: '1.75rem',
            maxWidth: '44rem',
          }}
        >
          <h2 style={label}>Honesty</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{engine.spendSafety.note}</p>
          <p style={{ margin: '0.35rem 0 0' }}>
            maxItems={engine.ceilings.maxItemsPerRun} · maxRetries={engine.ceilings.maxRetries} ·
            spark={String(engine.honesty.sparkOs)} · regeneratesJobs=
            {String(engine.honesty.regeneratesJobsApi)} · extendsBullMQ=
            {String(engine.honesty.extendsBullMqJobs)}
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem', maxWidth: '48rem' }}>
        <h2 style={label}>Kinds</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {kinds.map((k) => (
            <li key={k.id} style={{ marginBottom: '0.4rem' }}>
              <strong>{k.name}</strong> — {k.notes}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createSandbox()}
          style={{
            marginTop: '0.85rem',
            border: '1px solid var(--border)',
            background: 'transparent',
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
          }}
        >
          Create high-priority embedding batch
        </button>
      </section>

      <section style={{ maxWidth: '48rem' }}>
        <h2 style={label}>Runs</h2>
        {runs.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No runs yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {runs.map((r) => (
              <li key={r.id} style={{ marginBottom: '0.4rem' }}>
                {r.kind} · {r.priority} · {r.status} · {r.itemCount} items · ckpt=
                {r.checkpointIndex}
                {r.jobId ? ` · job ${r.jobId.slice(0, 8)}…` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
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

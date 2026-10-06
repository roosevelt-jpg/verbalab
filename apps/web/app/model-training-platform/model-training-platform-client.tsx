'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Method = {
  id: string;
  name: string;
  status: string;
  launchable: boolean;
  notes: string;
};

type Experiment = {
  id: string;
  method: string;
  name: string;
  status: string;
  checkpointIndex: number;
  baseModel: string;
};

type Engine = {
  product: string;
  note: string;
  honesty: {
    trainsCompetitiveFoundationWeights: boolean;
    distributedTrainingOs: boolean;
    rlhfLabOs: boolean;
    regeneratesVl111: boolean;
  };
  methods: Method[];
};

export function ModelTrainingPlatformClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/model-training-platform/engine', { token }),
      apiFetch<{ experiments: Experiment[] }>('/v1/model-training-platform/experiments', {
        token,
      }),
    ]);
    setEngine(eng);
    setExperiments(list.experiments);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const createLoraPlan = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/model-training-platform/experiments', {
        token,
        method: 'POST',
        body: JSON.stringify({
          method: 'lora',
          name: 'console-lora',
          sourceLang: 'en',
          targetLang: 'sw',
          hyperparams: { rank: 8, epochs: 1 },
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
        Model Training Platform
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Experiment plans and LoRA/instruction handoff to rented-GPU jobs — not a distributed
        training or RLHF lab.{' '}
        <Link href="/foundation-model-cloud">Foundation Model Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section
            style={{
              borderLeft: '3px solid #b45309',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)' }}>
              <li>
                trainsCompetitiveFoundationWeights:{' '}
                {String(engine.honesty.trainsCompetitiveFoundationWeights)}
              </li>
              <li>distributedTrainingOs: {String(engine.honesty.distributedTrainingOs)}</li>
              <li>rlhfLabOs: {String(engine.honesty.rlhfLabOs)}</li>
              <li>regeneratesVl111: {String(engine.honesty.regeneratesVl111)}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Actions</h2>
            <button type="button" onClick={() => void createLoraPlan()} disabled={busy} style={btn}>
              {busy ? 'Creating…' : 'Create LoRA experiment plan'}
            </button>
          </section>

          <section>
            <h2 style={label}>Methods</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {engine.methods.map((m) => (
                <li key={m.id}>
                  <strong>{m.name}</strong> ({m.status}
                  {m.launchable ? ' · launchable' : ''}) — {m.notes}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Experiments</h2>
            {experiments.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No experiment plans yet.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                {experiments.map((e) => (
                  <li key={e.id}>
                    <strong>{e.name}</strong> — {e.method} · {e.status} · ckpt {e.checkpointIndex} ·{' '}
                    {e.baseModel}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 0.5rem',
  color: 'var(--muted)',
};

const btn: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

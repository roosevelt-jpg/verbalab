'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
  ceilings: { maxActiveDeployments: number; mode: string };
  honesty: {
    vllmOs: boolean;
    kserveOs: boolean;
    regeneratesAiGateway: boolean;
    extendsAiGateway: boolean;
    sandboxDeploymentsOnly: boolean;
  };
  spendSafety: { note: string };
};

type Kind = {
  id: string;
  name: string;
  status: string;
  notes: string;
};

type Deployment = {
  id: string;
  kind: string;
  modelSlug: string;
  version: string;
  strategy: string;
  trafficPercent: number;
  status: string;
};

export function ModelServingClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, kindsRes, depRes] = await Promise.all([
      apiFetch<Engine>('/v1/model-serving/engine', { token }),
      apiFetch<{ kinds: Kind[] }>('/v1/model-serving/kinds', { token }),
      apiFetch<{ deployments: Deployment[] }>('/v1/model-serving/deployments', { token }),
    ]);
    setEngine(eng);
    setKinds(kindsRes.kinds);
    setDeployments(depRes.deployments);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const deployLlm = async  => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/model-serving/deployments', {
        token,
        method: 'POST',
        body: JSON.stringify({
          kind: 'llm',
          modelSlug: 'vendor-chat-openai',
          version: 'v1',
          strategy: 'canary',
          trafficPercent: 10,
          label: 'console',
        }),
      });
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed');
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
        Model Serving
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Serving hub over AI Gateway + model registry. Sandbox versioning, canary, and blue/green —
        not a vLLM OS. <Link href="/inference-cloud">Inference Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {engine ? (
        <section
          style={{
            borderLeft: '3px solid #0f766e',
            paddingLeft: '0.85rem',
            marginBottom: '1.75rem',
            maxWidth: '44rem',
          }}
        >
          <h2 style={label}>Honesty</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{engine.spendSafety.note}</p>
          <p style={{ margin: '0.35rem 0 0' }}>
            maxActive={engine.ceilings.maxActiveDeployments} · mode={engine.ceilings.mode} ·
            vllmOs={String(engine.honesty.vllmOs)} · extendsGateway=
            {String(engine.honesty.extendsAiGateway)} · sandbox=
            {String(engine.honesty.sandboxDeploymentsOnly)}
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem', maxWidth: '48rem' }}>
        <h2 style={label}>Model kinds</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {kinds.map((k) => (
            <li key={k.id} style={{ marginBottom: '0.45rem' }}>
              <strong>{k.name}</strong> · {k.status} — {k.notes}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={ => void deployLlm}
          style={{
            marginTop: '0.85rem',
            border: '1px solid var(--border)',
            background: 'transparent',
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
          }}
        >
          Deploy LLM canary (vendor-chat-openai)
        </button>
      </section>

      <section style={{ maxWidth: '48rem' }}>
        <h2 style={label}>Sandbox deployments</h2>
        {deployments.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No deployments yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {deployments.map((d) => (
              <li key={d.id} style={{ marginBottom: '0.45rem' }}>
                {d.kind}/{d.modelSlug}@{d.version} · {d.strategy} · {d.trafficPercent}% ·{' '}
                {d.status}
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

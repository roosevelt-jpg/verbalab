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
  honesty: {
    serviceMeshOs: boolean;
    multiCloudRouterOs: boolean;
    regeneratesAiGateway: boolean;
    extendsAiGateway: boolean;
    dryRunResolveOnly: boolean;
    enforcesSpendCaps: boolean;
  };
  spendSafety: { note: string };
  mode: string;
};

type ResolveResult = {
  decisionId: string;
  feature: string;
  optimize: string;
  selected: {
    providerId: string;
    modelSlug: string | null;
    estimatedLatencyMs: number;
    estimatedCostPer1kUsd: number;
  };
  chain: Array<{ order: number; providerId: string; role: string }>;
  note: string;
};

export function AiRouterClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [optimize, setOptimize] = useState('balanced');

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setEngine(await apiFetch<Engine>('/v1/ai-router/engine', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const resolve = async (feature: string) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<ResolveResult>('/v1/ai-router/resolve', {
        token,
        method: 'POST',
        body: JSON.stringify({ feature, optimize }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolve failed');
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
        AI Router
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Dry-run model/provider routing over the AI Gateway. Not a service mesh.{' '}
        <Link href="/inference-cloud">Inference Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {engine ? (
        <section
          style={{
            borderLeft: '3px solid #1d4ed8',
            paddingLeft: '0.85rem',
            marginBottom: '1.75rem',
            maxWidth: '44rem',
          }}
        >
          <h2 style={label}>Honesty</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{engine.spendSafety.note}</p>
          <p style={{ margin: '0.35rem 0 0' }}>
            mode={engine.mode} · mesh={String(engine.honesty.serviceMeshOs)} · dryRun=
            {String(engine.honesty.dryRunResolveOnly)} · enforcesSpend=
            {String(engine.honesty.enforcesSpendCaps)} · extendsGateway=
            {String(engine.honesty.extendsAiGateway)}
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem', maxWidth: '48rem' }}>
        <h2 style={label}>Resolve</h2>
        <label style={{ display: 'block', marginBottom: '0.65rem', color: 'var(--muted)' }}>
          Optimize{' '}
          <select
            value={optimize}
            onChange={(e) => setOptimize(e.target.value)}
            style={{ marginLeft: '0.35rem' }}
          >
            <option value="balanced">balanced</option>
            <option value="latency">latency</option>
            <option value="cost">cost</option>
            <option value="quality">quality</option>
          </select>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['chat', 'translate', 'stt', 'tts', 'embeddings', 'detect'].map((f) => (
            <button
              key={f}
              type="button"
              disabled={busy}
              onClick={() => void resolve(f)}
              style={{
                border: '1px solid var(--border)',
                background: 'transparent',
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {result ? (
        <section style={{ maxWidth: '48rem' }}>
          <h2 style={label}>Last decision</h2>
          <p style={{ margin: '0 0 0.5rem' }}>
            <strong>
              {result.selected.providerId}
              {result.selected.modelSlug ? ` / ${result.selected.modelSlug}` : ''}
            </strong>{' '}
            · {result.optimize} · ~{result.selected.estimatedLatencyMs}ms · $
            {result.selected.estimatedCostPer1kUsd}/1k
          </p>
          <p style={{ color: 'var(--muted)', margin: '0 0 0.75rem' }}>{result.note}</p>
          <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {result.chain.map((c) => (
              <li key={`${c.order}-${c.providerId}`}>
                {c.order}. {c.providerId} ({c.role})
              </li>
            ))}
          </ol>
        </section>
      ) : null}
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

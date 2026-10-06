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
  ceilings: { maxInstances: number; maxSpendUsd: number; provisionMode: string };
  honesty: {
    gpuHyperscalerOs: boolean;
    callsCloudGpuApis: boolean;
    openEndedGpuAutoscale: boolean;
    hardSpendCeilingsRequired: boolean;
    sandboxLogicalOnly: boolean;
  };
  spendSafety: { note: string };
};

type Pool = {
  id: string;
  vendor: string;
  name: string;
  estimatedHourlyUsd: number;
  status: string;
};

type Allocation = {
  id: string;
  poolId: string;
  vendor: string;
  instances: number;
  estimatedHourlyTotalUsd: number;
  status: string;
};

export function GpuPlatformClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, poolRes, allocRes] = await Promise.all([
      apiFetch<Engine>('/v1/gpu-platform/engine', { token }),
      apiFetch<{ pools: Pool[] }>('/v1/gpu-platform/pools', { token }),
      apiFetch<{ allocations: Allocation[] }>('/v1/gpu-platform/allocations', { token }),
    ]);
    setEngine(eng);
    setPools(poolRes.pools);
    setAllocations(allocRes.allocations);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const allocate = async (poolId: string) => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/gpu-platform/allocations', {
        token,
        method: 'POST',
        body: JSON.stringify({ poolId, instances: 1, purpose: 'console' }),
      });
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Allocate failed');
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
        GPU Platform
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Sandbox GPU pools with hard instance and spend ceilings. No cloud GPU APIs.{' '}
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
          <h2 style={label}>Spend safety</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{engine.spendSafety.note}</p>
          <p style={{ margin: '0.35rem 0 0' }}>
            maxInstances={engine.ceilings.maxInstances} · maxSpendUsd=$
            {engine.ceilings.maxSpendUsd} · mode={engine.ceilings.provisionMode} ·
            openEndedAutoscale={String(engine.honesty.openEndedGpuAutoscale)} · callsCloudApi=
            {String(engine.honesty.callsCloudGpuApis)}
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem', maxWidth: '48rem' }}>
        <h2 style={label}>Sandbox pools</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {pools.map((p) => (
            <li key={p.id} style={{ marginBottom: '0.55rem' }}>
              <strong>{p.name}</strong> ({p.vendor}) · ${p.estimatedHourlyUsd}/hr · {p.status}{' '}
              <button
                type="button"
                disabled={busy}
                onClick={ => void allocate(p.id)}
                style={{
                  marginLeft: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  padding: '0.15rem 0.5rem',
                  cursor: 'pointer',
                }}
              >
                Allocate 1
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ maxWidth: '48rem' }}>
        <h2 style={label}>Allocations</h2>
        {allocations.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>No allocations yet</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {allocations.map((a) => (
              <li key={a.id}>
                {a.poolId} · {a.instances}× · ${a.estimatedHourlyTotalUsd}/hr · {a.status}
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
  margin: '0 0 0.4rem',
};

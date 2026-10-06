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
    biDashboardOs: boolean;
    apmOs: boolean;
    regeneratesIntelligenceAnalytics: boolean;
    aggregatesOnly: boolean;
  };
  mode: string;
};

type Overview = {
  requests: { total: number };
  cache: { hits: number; misses: number; hitRate: number | null };
  cost: { ledgerUsd: number; gpuHourlyUsd: number };
  throughput: { routerDecisions: number; usageEvents: number };
  gpu: { activeInstances: number; hourlyUsd: number };
  errors: { total: number };
};

export function AiRuntimeAnalyticsClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ov] = await Promise.all([
      apiFetch<Engine>('/v1/ai-runtime-analytics/engine', { token }),
      apiFetch<Overview>('/v1/ai-runtime-analytics/overview', { token }),
    ]);
    setEngine(eng);
    setOverview(ov);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const loadReport = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/ai-runtime-analytics/report', { token });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>
          <Link href="/inference-cloud">Inference Cloud</Link> · AI Runtime Analytics
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0 0.75rem' }}>
          {engine?.product ?? 'AI Runtime Analytics'}
        </h1>
        <p style={{ lineHeight: 1.5, opacity: 0.85 }}>{engine?.note}</p>

        {engine && (
          <section style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Honesty</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>aggregatesOnly: {String(engine.honesty.aggregatesOnly)}</li>
              <li>biDashboardOs: {String(engine.honesty.biDashboardOs)}</li>
              <li>apmOs: {String(engine.honesty.apmOs)}</li>
              <li>
                regeneratesIntelligenceAnalytics:{' '}
                {String(engine.honesty.regeneratesIntelligenceAnalytics)}
              </li>
            </ul>
          </section>
        )}

        {overview && (
          <section style={{ marginTop: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Overview</h2>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              Requests {overview.requests.total} · Router {overview.throughput.routerDecisions} ·
              Cache hits {overview.cache.hits}/{overview.cache.misses} · GPU instances{' '}
              {overview.gpu.activeInstances} · Ledger ${overview.cost.ledgerUsd} · Errors{' '}
              {overview.errors.total}
            </p>
          </section>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void loadReport()}
          style={{
            marginTop: '1.25rem',
            padding: '0.65rem 1rem',
            border: '1px solid #222',
            background: '#111',
            color: '#fff',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Loading…' : 'Refresh report'}
        </button>

        {error && (
          <p style={{ marginTop: '1rem', color: '#b00020' }} role="alert">
            {error}
          </p>
        )}
      </main>
    </AppShell>
  );
}

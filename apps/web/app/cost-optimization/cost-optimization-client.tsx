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
    finOpsOs: boolean;
    cloudSpotApis: boolean;
    enforcesSpendCaps: boolean;
    reportOnly: boolean;
  };
  ceilings: { defaultDailyCapUsd: number; defaultMonthlyCapUsd: number; mode: string };
  spendSafety: { enforcesSpendCaps: boolean; note: string };
};

type BudgetRes = {
  budget: {
    dailyCapUsd: number;
    monthlyCapUsd: number;
    enforce: boolean;
    preferSpot: boolean;
    persisted: boolean;
  };
};

export function CostOptimizationClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [budget, setBudget] = useState<BudgetRes['budget'] | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, bud] = await Promise.all([
      apiFetch<Engine>('/v1/cost-optimization/engine', { token }),
      apiFetch<BudgetRes>('/v1/cost-optimization/budgets', { token }),
    ]);
    setEngine(eng);
    setBudget(bud.budget);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const demo = async  => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/cost-optimization/budgets', {
        token,
        method: 'PUT',
        body: JSON.stringify({
          dailyCapUsd: 1,
          monthlyCapUsd: 10,
          enforce: true,
          preferSpot: true,
        }),
      });
      const rec = await apiFetch<{ event: { amountUsd: number } }>(
        '/v1/cost-optimization/record',
        {
          token,
          method: 'POST',
          body: JSON.stringify({
            category: 'provider',
            amountUsd: 0.25,
            feature: 'chat',
            label: 'demo',
          }),
        },
      );
      const opt = await apiFetch<{ selected?: { providerId: string }; spendGate: { allowed: boolean } }>(
        '/v1/cost-optimization/optimize',
        {
          token,
          method: 'POST',
          body: JSON.stringify({ feature: 'chat' }),
        },
      );
      setResult(
        `recorded $${rec.event.amountUsd}; optimize→${opt.selected?.providerId ?? 'n/a'} gate=${opt.spendGate.allowed}`,
      );
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cost demo failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>
          <Link href="/inference-cloud">Inference Cloud</Link> · Cost Optimization
        </p>
        <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0 0.75rem' }}>
          {engine?.product ?? 'Cost Optimization'}
        </h1>
        <p style={{ lineHeight: 1.5, opacity: 0.85 }}>{engine?.note}</p>

        {engine && (
          <section style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Honesty</h2>
            <ul style={{ lineHeight: 1.6 }}>
              <li>enforcesSpendCaps: {String(engine.honesty.enforcesSpendCaps)}</li>
              <li>reportOnly: {String(engine.honesty.reportOnly)}</li>
              <li>finOpsOs: {String(engine.honesty.finOpsOs)}</li>
              <li>cloudSpotApis: {String(engine.honesty.cloudSpotApis)}</li>
            </ul>
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{engine.spendSafety.note}</p>
          </section>
        )}

        {budget && (
          <section style={{ marginTop: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Budget</h2>
            <p style={{ opacity: 0.85 }}>
              Daily ${budget.dailyCapUsd} · Monthly ${budget.monthlyCapUsd} · enforce=
              {String(budget.enforce)} · preferSpot={String(budget.preferSpot)}
              {budget.persisted ? '' : ' (defaults)'}
            </p>
          </section>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={ => void demo}
          style={{
            marginTop: '1.25rem',
            padding: '0.65rem 1rem',
            border: '1px solid #222',
            background: '#111',
            color: '#fff',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Working…' : 'Demo budget + record + optimize'}
        </button>

        {result && (
          <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
            {result}
          </pre>
        )}
        {error && (
          <p style={{ marginTop: '1rem', color: '#b00020' }} role="alert">
            {error}
          </p>
        )}
      </main>
    </AppShell>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';

type PilotDashboard = {
  funnels: {
    dealbridge: { started: number; issued: number; rate: number | null };
    baseline: { started: number; issued: number; rate: number | null };
    allNonFixture: { started: number; issued: number; rate: number | null };
  };
  repeatMerchantUsage28d: {
    eligible: number;
    success: number;
    rate: number | null;
    note: string;
  };
  processingCost: {
    totalUsd: number;
    perStartedSessionUsd: number | null;
    perIssuedReceiptUsd: number | null;
  };
  eventCounts: Record<string, number>;
  note: string;
  limitations: string[];
};

export function DealBridgePilotAdminClient() {
  const { getToken, isSignedIn } = useAuth();
  const [dash, setDash] = useState<PilotDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportJson, setExportJson] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in as a platform admin');
      const res = await apiFetch<PilotDashboard>('/v1/admin/dealbridge/pilot', { token });
      setDash(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pilot dashboard');
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) void load();
  }, [isSignedIn, load]);

  async function ensureConfig() {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in as a platform admin');
      await apiFetch('/v1/admin/dealbridge/pilot/config', {
        method: 'POST',
        token,
        body: {
          version: 'pilot-v1',
          category: 'wholesale_rice',
          corridor: 'en-fr',
          merchantVariety: 'en',
          buyerVariety: 'fr',
        },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Config upsert failed');
    }
  }

  async function exportData() {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in as a platform admin');
      const res = await apiFetch<unknown>('/v1/admin/dealbridge/pilot/export', { token });
      setExportJson(JSON.stringify(res, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }

  return (
    <main className="vl-page" style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <h1 style={{ fontSize: '1.8rem' }}>DealBridge pilot admin</h1>
      <p style={{ color: 'var(--muted)' }}>
        Restricted cohort dashboard. No fabricated traction metrics. Fixtures/demo sessions are excluded
        from merchant funnels.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className="vl-btn" type="button" onClick={() => void load()}>
          Refresh
        </button>
        <button className="vl-btn" type="button" onClick={() => void ensureConfig()}>
          Upsert pilot config
        </button>
        <button className="vl-btn" type="button" onClick={() => void exportData()}>
          Redacted export
        </button>
      </div>

      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}

      {dash && (
        <>
          <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Funnels</h2>
            <ul>
              <li>
                DealBridge: {dash.funnels.dealbridge.issued}/{dash.funnels.dealbridge.started} issued
                {dash.funnels.dealbridge.rate != null
                  ? ` (${(dash.funnels.dealbridge.rate * 100).toFixed(1)}%)`
                  : ''}
              </li>
              <li>
                Baseline: {dash.funnels.baseline.issued}/{dash.funnels.baseline.started} issued
                {dash.funnels.baseline.rate != null
                  ? ` (${(dash.funnels.baseline.rate * 100).toFixed(1)}%)`
                  : ''}
              </li>
              <li>
                All non-fixture: {dash.funnels.allNonFixture.issued}/
                {dash.funnels.allNonFixture.started}
              </li>
            </ul>
          </section>
          <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>28-day repeat usage</h2>
            <p>
              {dash.repeatMerchantUsage28d.success}/{dash.repeatMerchantUsage28d.eligible}
              {dash.repeatMerchantUsage28d.rate != null
                ? ` (${(dash.repeatMerchantUsage28d.rate * 100).toFixed(1)}%)`
                : ' (no eligible window yet)'}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              {dash.repeatMerchantUsage28d.note}
            </p>
          </section>
          <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Processing cost</h2>
            <p>Total USD: {dash.processingCost.totalUsd.toFixed(4)}</p>
            <p>
              Per started: {dash.processingCost.perStartedSessionUsd?.toFixed(4) ?? 'n/a'} · Per
              receipt: {dash.processingCost.perIssuedReceiptUsd?.toFixed(4) ?? 'n/a'}
            </p>
          </section>
          <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Event counts</h2>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {JSON.stringify(dash.eventCounts, null, 2)}
            </pre>
            <p style={{ color: 'var(--muted)' }}>{dash.note}</p>
            <ul>
              {dash.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        </>
      )}

      {exportJson && (
        <section className="vl-panel" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Redacted JSON export</h2>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 420, overflow: 'auto' }}>{exportJson}</pre>
        </section>
      )}
    </main>
  );
}

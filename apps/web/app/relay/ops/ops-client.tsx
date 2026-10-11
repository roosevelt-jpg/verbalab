'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { RelayAuthGate, type RelayAuthBag } from '@/lib/relay-auth';

type Overview = {
  overview: {
    approvedInterpreters: number;
    pendingReview: number;
    unmatchedRequests: number;
    upcomingBookings: number;
    openDisputes: number;
    paymentReconciliations: number;
  };
  slaNote: string;
};

export function RelayOpsClient() {
  return <RelayAuthGate>{(auth) => <OpsFlow auth={auth} />}</RelayAuthGate>;
}

function OpsFlow({ auth }: { auth: RelayAuthBag }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth.ready) return;
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<Overview>('/v1/relay/ops/overview', {
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load ops');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  const o = data?.overview;

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Relay"
          title="Dispatcher overview"
          lede="Coverage, unmatched backlog, disputes and payment reconciliation — human-operated."
        >
          <div className="lg-page-header__actions">
            <Link href="/relay" className="vl-btn vl-btn-secondary">
              Back
            </Link>
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </PageHeader>

        {!auth.signedIn ? (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', margin: '1rem 0' }}>
            <input
              className="vl-field"
              placeholder="lg_live_… or lg_test_…"
              value={auth.apiKey}
              onChange={(e) => auth.setApiKey(e.target.value)}
            />
            <input
              className="vl-field"
              placeholder="Actor id"
              value={auth.actorId}
              onChange={(e) => auth.setActorId(e.target.value)}
            />
            <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void load()}>
              Load
            </button>
          </section>
        ) : null}

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        {data?.slaNote ? <p className="lg-type-compact">{data.slaNote}</p> : null}

        {o ? (
          <ul className="lg-type-compact" style={{ paddingLeft: '1.2rem' }}>
            <li>Approved interpreters: {o.approvedInterpreters}</li>
            <li>Pending review: {o.pendingReview}</li>
            <li>Unmatched requests: {o.unmatchedRequests}</li>
            <li>Upcoming bookings: {o.upcomingBookings}</li>
            <li>Open disputes: {o.openDisputes}</li>
            <li>Payment reconciliations: {o.paymentReconciliations}</li>
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}

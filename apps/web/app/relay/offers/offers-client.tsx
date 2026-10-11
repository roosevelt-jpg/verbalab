'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { RelayAuthGate, type RelayAuthBag } from '@/lib/relay-auth';

type Offer = {
  id: string;
  expiresAt: string;
  request: { id: string; corridorId: string; category: string; preferredStartAt: string };
  quotes: Array<{ id: string; currency: string; amountMinor: number }>;
  interpreter: { displayName: string; supplyKind: string };
};

export function RelayOffersClient() {
  return <RelayAuthGate>{(auth) => <OffersFlow auth={auth} />}</RelayAuthGate>;
}

function OffersFlow({ auth }: { auth: RelayAuthBag }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!auth.ready) return;
    setError(null);
    try {
      const a = await auth.authHeaders();
      const res = await apiFetch<{ offers: Offer[] }>('/v1/relay/offers', {
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
      });
      setOffers(res.offers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load offers');
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(id: string) {
    setBusy(true);
    try {
      const a = await auth.authHeaders();
      await apiFetch(`/v1/relay/offers/${id}/accept`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-Relay-Actor-Id': a.actor } : undefined,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="Relay"
          title="Pending offers"
          lede="Accept before expiry. Demo staffed profiles are labeled — not a hired pool."
        >
          <div className="lg-page-header__actions">
            <Link href="/relay" className="vl-btn vl-btn-secondary">
              Back
            </Link>
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

        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
          {!offers.length ? (
            <li className="lg-type-compact">No pending offers.</li>
          ) : (
            offers.map((o) => (
              <li key={o.id} className="lg-card" style={{ display: 'grid', gap: '0.35rem' }}>
                <strong>
                  {o.request.corridorId} · {o.request.category}
                </strong>
                <p className="lg-type-compact">
                  Starts {new Date(o.request.preferredStartAt).toLocaleString()} · expires{' '}
                  {new Date(o.expiresAt).toLocaleString()}
                </p>
                {o.quotes[0] ? (
                  <p className="lg-type-compact">
                    Quote {o.quotes[0].currency} {(o.quotes[0].amountMinor / 100).toFixed(2)}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy}
                  onClick={() => void accept(o.id)}
                >
                  Accept offer
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}

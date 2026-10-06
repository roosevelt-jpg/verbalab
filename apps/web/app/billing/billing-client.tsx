'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type BillingSummary = {
  plan: string;
  planName: string;
  billingStatus: string;
  characterQuota: number;
  charactersUsed: number;
  charactersRemaining: number;
  periodStart: string;
  requests: number;
  stripeConfigured: boolean;
  hasCustomer: boolean;
};

type MemberRow = {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null };
};

export function BillingClient() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [billing, memberRows] = await Promise.all([
      apiFetch<BillingSummary>('/v1/billing/summary', { token }),
      apiFetch<MemberRow[]>('/v1/organization/members', { token }),
    ]);
    setSummary(billing);
    setMembers(memberRows);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function startCheckout() {
    setError(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ url: string | null }>('/v1/billing/checkout', {
        method: 'POST',
        token,
      });
      if (!res.url) throw new Error('Stripe did not return a checkout URL');
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  }

  async function openPortal() {
    setError(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ url: string }>('/v1/billing/portal', {
        method: 'POST',
        token,
      });
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal failed');
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Billing
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Free tier includes a monthly character quota. Upgrade to Pro for higher limits — cards stay with Stripe.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {summary ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
          <div
            className="vl-panel"
            style={{
              padding: '1.35rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '1rem',
              background: 'var(--bg-soft)',
              border: 'none',
            }}
          >
            <Stat label="Plan" value={summary.planName} />
            <Stat label="Used" value={`${summary.charactersUsed.toLocaleString()} chars`} />
            <Stat label="Quota" value={`${summary.characterQuota.toLocaleString()} / mo`} />
          </div>

          <div className="vl-panel" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Status: <strong style={{ color: 'var(--ink)' }}>{summary.billingStatus}</strong>
              {' · '}
              Remaining this period: {summary.charactersRemaining.toLocaleString()} characters
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
              {summary.plan !== 'pro' ? (
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy || !summary.stripeConfigured}
                  onClick={() => void startCheckout()}
                >
                  Upgrade to Pro
                </button>
              ) : null}
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy || !summary.stripeConfigured || !summary.hasCustomer}
                onClick={() => void openPortal()}
              >
                Manage payment method
              </button>
            </div>
            {!summary.stripeConfigured ? (
              <p style={{ color: 'var(--muted)', marginBottom: 0, marginTop: '1rem' }}>
                Stripe is not configured yet. Add <code className="vl-code">STRIPE_SECRET_KEY</code>,{' '}
                <code className="vl-code">STRIPE_PRICE_ID_PRO</code>,{' '}
                <code className="vl-code">STRIPE_WEBHOOK_SECRET</code>, and billing URLs to{' '}
                <code className="vl-code">apps/api/.env</code>.
              </p>
            ) : null}
          </div>

          <div className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Members</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Invite teammates in Clerk Organizations. Manage roles on{' '}
              <a href="/identity" style={{ color: 'var(--accent)' }}>
                Identity
              </a>
              .
            </p>
            {members.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>No members loaded.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                {members.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      padding: '0.65rem 0',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.user.name ?? m.user.email ?? m.user.id}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{m.user.email}</div>
                    </div>
                    <div className="vl-code" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {m.role}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '1rem', border: '1px solid var(--line)' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

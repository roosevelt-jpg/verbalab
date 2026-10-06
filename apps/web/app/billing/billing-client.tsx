'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { ProgressRing } from '@/components/stats/stat-charts';
import '@/components/stats/stat-charts.css';

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

type PlanCard = {
  id: string;
  name: string;
  rank: number;
  characterQuota: number;
  priceLabel: string;
  priceMonthlyUsd: number | null;
  blurb: string;
  features: string[];
  highlight: boolean;
  checkoutAvailable: boolean;
};

type MemberRow = {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null };
};

const FEATURE_LABELS: Record<string, string> = {
  speech: 'Speech & TTS',
  translate: 'Translate',
  playground: 'Playground',
  commercial: 'Commercial use',
  voiceClones: 'Voice clones',
  marketplace: 'Marketplace',
  fineTunes: 'Fine-tunes',
  prioritySupport: 'Priority support',
  workspacesExtra: 'Extra workspaces',
  sso: 'SSO',
  dedicated: 'Dedicated capacity',
};

export function BillingClient() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [plans, setPlans] = useState<PlanCard[]>([]);
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
    try {
      const planRes = await apiFetch<{ plans: PlanCard[] }>('/v1/billing/plans', { token });
      setPlans(planRes.plans);
    } catch {
      const { WEB_BILLING_PLANS } = await import('@/data/billing-plans');
      setPlans(WEB_BILLING_PLANS);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function startCheckout(planId: string) {
    setError(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      if (planId === 'enterprise') {
        window.location.href = '/sign-up';
        return;
      }
      const res = await apiFetch<{ url: string | null }>('/v1/billing/checkout', {
        method: 'POST',
        token,
        body: JSON.stringify({ planId }),
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

  const currentRank = plans.find((p) => p.id === summary?.plan)?.rank ?? 0;

  return (
    <AppShell>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          fontSize: '2rem',
          color: 'var(--brand-navy)',
        }}
      >
        Billing & plans
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', lineHeight: 1.6, maxWidth: '42rem' }}>
        Workspace entitlements mirror ElevenLabs-style tiers: Free → Starter → Creator → Pro → Scale → Enterprise.
        Features unlock with your plan; Stripe keeps cards on file.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {summary ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
              gap: '0.75rem',
              alignItems: 'stretch',
            }}
          >
            <Stat label="Current plan" value={summary.planName} />
            <Stat label="Status" value={summary.billingStatus} />
            <div className="vl-endpoint-card" style={{ display: 'flex', alignItems: 'center' }}>
              <ProgressRing
                value={summary.charactersUsed}
                max={summary.characterQuota}
                label="Quota used"
                sublabel={`${summary.charactersRemaining.toLocaleString()} remaining`}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
            }}
          >
            {plans.map((plan) => {
              const isCurrent = plan.id === summary.plan;
              const isUpgrade = plan.rank > currentRank;
              return (
                <article
                  key={plan.id}
                  className="vl-endpoint-card"
                  style={{
                    border: plan.highlight ? '1px solid var(--action-primary)' : undefined,
                    display: 'grid',
                    gap: '0.65rem',
                    alignContent: 'start',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--brand-navy)' }}>{plan.name}</h2>
                    {isCurrent ? <span className="vl-tag">Current</span> : null}
                    {plan.highlight && !isCurrent ? <span className="vl-tag">Popular</span> : null}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 720 }}>
                    {plan.priceLabel}
                    {plan.priceMonthlyUsd !== null ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}> / mo</span>
                    ) : null}
                  </div>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{plan.blurb}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
                    {plan.characterQuota.toLocaleString()} characters / mo
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {plan.features.map((f) => (
                      <li key={f}>{FEATURE_LABELS[f] ?? f}</li>
                    ))}
                  </ul>
                  {plan.id === 'free' ? (
                    <button type="button" className="vl-btn" disabled>
                      Included
                    </button>
                  ) : plan.id === 'enterprise' ? (
                    <a className="vl-btn vl-btn-secondary" href="/p/about" style={{ textDecoration: 'none', textAlign: 'center' }}>
                      Talk to sales
                    </a>
                  ) : isCurrent ? (
                    <button type="button" className="vl-btn" disabled>
                      Active
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={isUpgrade ? 'vl-btn vl-btn-primary' : 'vl-btn vl-btn-secondary'}
                      disabled={busy || !plan.checkoutAvailable}
                      onClick={() => void startCheckout(plan.id)}
                    >
                      {isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <div className="vl-endpoint-card">
            <div className="vl-player-bar" style={{ border: 'none', padding: 0, background: 'transparent' }}>
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
                Stripe is not fully configured. Set <code className="vl-code">STRIPE_SECRET_KEY</code>, price IDs (
                <code className="vl-code">STRIPE_PRICE_ID_STARTER</code> … <code className="vl-code">_SCALE</code>),
                webhook secret, and billing URLs.
              </p>
            ) : null}
          </div>

          <div className="vl-endpoint-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--brand-navy)' }}>Workspace members</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Each org workspace inherits the subscribed plan features. Invite teammates in Clerk Organizations.
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
    <div className="vl-endpoint-card">
      <div
        style={{
          color: 'var(--muted)',
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.35rem',
          fontWeight: 700,
          marginTop: 4,
          color: 'var(--brand-navy)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

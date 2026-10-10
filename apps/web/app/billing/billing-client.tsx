'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { usePlatformAdmin } from '@/lib/use-platform-admin';
import { AppShell } from '@/components/app-shell';
import { ProgressRing, LineChart, seedUsageSeries } from '@/components/stats/stat-charts';
import {
  ActivityBoard,
  UsageMeter,
  StatusRing,
  PipelineStrip,
} from '@/components/stats/activity-visuals';
import {
  FEATURE_LABELS,
  WEB_BILLING_PLANS,
  formatWorkspaceLimit,
  planById,
} from '@/data/billing-plans';
import '@/components/stats/stat-charts.css';

type BillingSummary = {
  plan: string;
  planName: string;
  billingStatus: string;
  characterQuota: number;
  baseCharacterQuota?: number;
  charactersUsed: number;
  charactersRemaining: number;
  quotas?: {
    tts: { quotaChars: number; usedChars: number; remainingChars: number };
    stt: { quotaMinutes: number; usedMinutes: number; remainingMinutes: number };
    translate: { quotaChars: number; usedChars: number; remainingChars: number };
    chat: { quotaTokens: number; usedTokens: number; remainingTokens: number };
  };
  topUps?: Record<string, number>;
  availableTopUpPacks?: Array<{
    id: string;
    name: string;
    productKind: string;
    units: number;
    unitLabel: string;
    priceCents: number;
    priceLabel: string;
    blurb: string;
  }>;
  periodStart: string;
  requests: number;
  stripeConfigured: boolean;
  hasCustomer: boolean;
  features?: string[];
  workspaceLimit?: number;
};

type PlanCard = {
  id: string;
  name: string;
  rank: number;
  characterQuota: number;
  workspaceLimit?: number;
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

function localMockSummary(): BillingSummary {
  const free = WEB_BILLING_PLANS[0]!;
  return {
    plan: free.id,
    planName: free.name,
    billingStatus: 'active',
    characterQuota: free.characterQuota,
    charactersUsed: 0,
    charactersRemaining: free.characterQuota,
    periodStart: new Date().toISOString(),
    requests: 0,
    stripeConfigured: false,
    hasCustomer: false,
    features: free.features,
    workspaceLimit: free.workspaceLimit,
  };
}

function isNetworkLoadError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg === 'load failed' ||
    msg === 'failed to fetch' ||
    msg.includes('cannot reach api') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('fetch failed')
  );
}

/** Prefer live admin catalog; fall back to the hardcoded four-plan seed. */
function catalogOrFallback(plans: PlanCard[]): PlanCard[] {
  return plans?.length ? plans : WEB_BILLING_PLANS;
}

function normalizeSummary(summary: BillingSummary): BillingSummary {
  const plan = planById(summary.plan);
  return {
    ...summary,
    plan: plan.id,
    planName: plan.name,
    features: summary.features ?? plan.features,
    workspaceLimit: summary.workspaceLimit ?? plan.workspaceLimit,
  };
}

export function BillingClient() {
  const { getToken, isLoaded, userId } = useAuth();
  const platformAdmin = usePlatformAdmin(userId, getToken);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [plans, setPlans] = useState<PlanCard[]>(WEB_BILLING_PLANS);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usingLocalBilling, setUsingLocalBilling] = useState(false);

  const load = useCallback(async () => {
    // Seed catalog immediately so Stripe-off / API blips never blank the page.
    setPlans(WEB_BILLING_PLANS);

    // Public plans catalog — no auth required.
    try {
      const planRes = await apiFetch<{ plans: PlanCard[] }>('/v1/billing/plans');
      setPlans(catalogOrFallback(planRes.plans));
    } catch {
      setPlans(WEB_BILLING_PLANS);
    }

    const token = await getToken();
    if (!token) {
      setSummary(localMockSummary());
      setUsingLocalBilling(true);
      return;
    }

    try {
      const [billing, memberRows] = await Promise.all([
        apiFetch<BillingSummary>('/v1/billing/summary', { token }),
        apiFetch<MemberRow[]>('/v1/organization/members', { token }).catch(() => [] as MemberRow[]),
      ]);
      setSummary(normalizeSummary(billing));
      setMembers(memberRows);
      setUsingLocalBilling(false);
      setError(null);
    } catch (err) {
      if (isNetworkLoadError(err)) {
        // Cross-origin / CORP / offline: stay usable with local mock state.
        setSummary(localMockSummary());
        setMembers([]);
        setUsingLocalBilling(true);
        setError(null);
      } else {
        throw err;
      }
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Billing failed to load';
      // Never leave the page empty — show Free mock catalog when auth/API is soft-failing.
      setSummary((prev) => prev ?? localMockSummary());
      setPlans(WEB_BILLING_PLANS);
      setUsingLocalBilling(true);
      if (!isNetworkLoadError(err)) {
        setError(message);
      }
    });
  }, [isLoaded, load]);

  async function startCheckout(planId: string) {
    setError(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      if (planId === 'enterprise') {
        window.location.href = '/enterprise';
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

  async function buyTopUp(packId: string) {
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        url: string | null;
        mode: 'stripe' | 'mock';
        unitsGranted?: number;
        productKind?: string;
      }>('/v1/billing/topups/purchase', {
        method: 'POST',
        token,
        body: JSON.stringify({ packId }),
      });

      if (res.url) {
        window.location.href = res.url;
      } else {
        setSuccessMsg(
          `Top-up successful! Added ${res.unitsGranted?.toLocaleString()} ${res.productKind} credits directly to your organization.`,
        );
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Top-up purchase failed');
    } finally {
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
        Each workspace inherits your subscription. Plans:
        Free → Pro → Business → Enterprise. Features and workspace seats unlock with your plan.
        Prefer a marketing view? See{' '}
        <a href="/pricing" style={{ color: 'var(--action-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Pricing
        </a>
        .
      </p>

      {usingLocalBilling ? (
        <p style={{ color: 'var(--muted)', margin: '0.75rem 0 0', fontSize: '0.9rem' }}>
          Showing local billing catalog (API unreachable or Stripe not required for browsing plans).
        </p>
      ) : null}

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {successMsg ? (
        <p style={{ color: 'var(--accent-teal)', fontWeight: 600, padding: '0.75rem', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '6px' }}>
          {successMsg}
        </p>
      ) : null}

      {summary ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>
          <ActivityBoard kicker="Usage meters" title="Billing activity">
            <PipelineStrip
              title="Metering path"
              stages={[
                { id: 'plan', label: 'Plan', state: 'ready' },
                { id: 'meter', label: 'Meter', state: summary.requests > 0 ? 'active' : 'idle' },
                {
                  id: 'quota',
                  label: 'Quota',
                  state:
                    summary.charactersUsed / Math.max(summary.characterQuota, 1) > 0.9
                      ? 'error'
                      : 'ready',
                },
                { id: 'pay', label: 'Billing', state: summary.stripeConfigured ? 'ready' : 'idle' },
              ]}
            />
            <div className="lg-studio-overview">
              <UsageMeter
                label="Voice & TTS quota"
                value={summary.quotas?.tts.usedChars ?? summary.charactersUsed}
                max={summary.quotas?.tts.quotaChars ?? summary.characterQuota}
                unit="chars"
              />
              <UsageMeter
                label="STT transcription"
                value={Math.round(summary.quotas?.stt.usedMinutes ?? 0)}
                max={summary.quotas?.stt.quotaMinutes ?? 120}
                unit="mins"
              />
              <UsageMeter
                label="Translate quota"
                value={summary.quotas?.translate.usedChars ?? summary.charactersUsed}
                max={summary.quotas?.translate.quotaChars ?? summary.characterQuota}
                unit="chars"
              />
              <UsageMeter
                label="Chat & Agent tokens"
                value={summary.quotas?.chat.usedTokens ?? 0}
                max={summary.quotas?.chat.quotaTokens ?? 500000}
                unit="tokens"
              />
              <StatusRing
                status={
                  summary.billingStatus === 'active' || summary.billingStatus === 'trialing'
                    ? 'ok'
                    : summary.billingStatus === 'past_due'
                      ? 'bad'
                      : 'warn'
                }
                label={summary.planName}
                detail={summary.billingStatus}
              />
              <ProgressRing
                value={summary.charactersUsed}
                max={summary.characterQuota}
                label="Quota used"
                sublabel={`${summary.charactersRemaining.toLocaleString()} remaining`}
              />
            </div>
            <LineChart
              title="Usage trend"
              series={seedUsageSeries(summary.charactersUsed, summary.requests)}
            />
          </ActivityBoard>

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
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {formatWorkspaceLimit(plan.workspaceLimit ?? 1)} workspace
                    {(plan.workspaceLimit ?? 1) === 1 ? '' : 's'}
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {plan.features.map((f) => (
                      <li key={f}>{FEATURE_LABELS[f] ?? f}</li>
                    ))}
                  </ul>
                  {platformAdmin ? (
                    <button type="button" className="vl-btn" disabled>
                      {isCurrent ? 'Full access' : 'Managed in Admin'}
                    </button>
                  ) : isCurrent ? (
                    <button type="button" className="vl-btn" disabled>
                      {plan.id === 'free' ? 'Included' : 'Active'}
                    </button>
                  ) : plan.id === 'free' ? (
                    <button type="button" className="vl-btn" disabled>
                      Included
                    </button>
                  ) : plan.id === 'enterprise' ? (
                    <a
                      className="vl-btn vl-btn-secondary"
                      href="/enterprise"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      Talk to sales
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={isUpgrade ? 'vl-btn vl-btn-primary' : 'vl-btn vl-btn-secondary'}
                      disabled={busy || !plan.checkoutAvailable || usingLocalBilling}
                      onClick={() => void startCheckout(plan.id)}
                    >
                      {isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          {/* Quota Top-Ups Refill Section */}
          <div className="vl-endpoint-card" style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--brand-navy)' }}>
                Quota Top-Ups (Buy More Pay-As-You-Go)
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.35rem 0 0' }}>
                Exhausted your monthly plan limits? Purchase additional token or character packs instantly.
                Top-up credits never expire and apply automatically whenever your base monthly plan quota runs out.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
              }}
            >
              {(summary.availableTopUpPacks ?? []).map((pack) => (
                <div
                  key={pack.id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'grid',
                    gap: '0.5rem',
                    background: 'var(--card-bg, #fff)',
                  }}
                >
                  <div style={{ fontWeight: 650, fontSize: '0.95rem' }}>{pack.name}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
                    {pack.priceLabel}
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{pack.blurb}</p>
                  <button
                    type="button"
                    className="vl-btn vl-btn-primary"
                    style={{ marginTop: '0.5rem' }}
                    disabled={busy || usingLocalBilling}
                    onClick={() => void buyTopUp(pack.id)}
                  >
                    Buy Top-Up Pack
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="vl-endpoint-card">
            <div className="vl-player-bar" style={{ border: 'none', padding: 0, background: 'transparent' }}>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy || !summary.stripeConfigured || !summary.hasCustomer || usingLocalBilling}
                onClick={() => void openPortal()}
              >
                Manage payment method
              </button>
            </div>
            {!summary.stripeConfigured ? (
              <p style={{ color: 'var(--muted)', marginBottom: 0, marginTop: '1rem' }}>
                Stripe is not fully configured. Set <code className="vl-code">STRIPE_SECRET_KEY</code>, price IDs (
                <code className="vl-code">STRIPE_PRICE_ID_PRO</code>, <code className="vl-code">STRIPE_PRICE_ID_BUSINESS</code>),
                webhook secret, and billing URLs.
              </p>
            ) : null}
          </div>

          <div className="vl-endpoint-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--brand-navy)' }}>Workspace members</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 0.75rem' }}>
              Every workspace under this org inherits the subscribed plan. Invite teammates with owner / admin /
              member roles from Identity — they share this workspace after signing in.
            </p>
            <p style={{ margin: '0 0 1rem' }}>
              <a href="/identity" style={{ color: 'var(--action-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Invite teammates →
              </a>
            </p>
            {members.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>
                No members yet. Open Identity to send an invite.
              </p>
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

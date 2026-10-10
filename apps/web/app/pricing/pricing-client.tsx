'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useId, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import {
  FEATURE_LABELS,
  WEB_BILLING_PLANS,
  formatWorkspaceLimit,
  planById,
  type WebPlan,
} from '@/data/billing-plans';

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

type BillingLite = {
  plan: string;
  planName: string;
  stripeConfigured: boolean;
  hasCustomer: boolean;
};

const CANONICAL_IDS = new Set(WEB_BILLING_PLANS.map((p) => p.id));

const COMPARE_ROWS: { key: string; label: string; kind: 'feature' | 'quota' | 'workspaces' }[] = [
  { key: 'quota', label: 'Characters / month', kind: 'quota' },
  { key: 'workspaces', label: 'Workspaces', kind: 'workspaces' },
  ...Object.entries(FEATURE_LABELS).map(([key, label]) => ({
    key,
    label,
    kind: 'feature' as const,
  })),
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What plans does Lugemi offer?',
    a: 'Exactly four: Free ($0, 50k characters), Pro ($99/mo, 2M characters), Business ($330/mo, 11M characters and 3 workspaces), and Enterprise (custom pricing, SSO, dedicated capacity). Every workspace under your organization inherits the subscribed plan.',
  },
  {
    q: 'How do character quotas work?',
    a: 'Speech, translate, and related generation paths draw from one monthly character pool on your organization. Usage resets each billing period. When you hit the cap, metered endpoints return a quota error — upgrade under Pricing or Billing, or wait for the next period.',
  },
  {
    q: 'Is billing monthly or annual?',
    a: 'Paid plans are billed monthly through Stripe Checkout. Annual billing is not offered yet — prices shown are the honest monthly rates.',
  },
  {
    q: 'How do I upgrade or manage payment?',
    a: 'Sign in as an organization owner or admin, choose Pro or Business on this page (or under Billing), and complete Stripe Checkout. After you have a customer record, open the billing portal from Billing to update the payment method.',
  },
  {
    q: 'What unlocks with Pro and above?',
    a: 'Pro adds commercial use, voice clones, marketplace, fine-tunes, and priority support paths. Business adds extra workspaces. Enterprise adds SSO and dedicated capacity under a custom contract.',
  },
  {
    q: 'Can I start for free?',
    a: 'Yes. Create an account and use the Free plan with speech, translate, and playground under the monthly character quota. Upgrade when you need production entitlements or higher volume.',
  },
];

function onlyFourPlans(plans: PlanCard[]): PlanCard[] {
  // If plans from backend contains custom plans or the 4 base plans, preserve them
  if (plans && plans.length >= 4) return plans;
  const filtered = plans.filter((p) => CANONICAL_IDS.has(p.id as WebPlan['id']));
  if (filtered.length === 4) return filtered;
  return WEB_BILLING_PLANS;
}

function cellValue(plan: PlanCard, row: (typeof COMPARE_ROWS)[number]): string {
  if (row.kind === 'quota') return plan.characterQuota.toLocaleString();
  if (row.kind === 'workspaces') return formatWorkspaceLimit(plan.workspaceLimit ?? 1);
  return plan.features.includes(row.key) ? 'Yes' : '—';
}

type AuthBag = {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn: boolean;
};

/** Public entry — avoids useAuth crash when ClerkProvider is not mounted. */
export function PricingClient({ brandName }: { brandName: string }) {
  if (!isClerkConfigured()) {
    return (
      <PricingFlow
        brandName={brandName}
        getToken={async () => null}
        isLoaded
        isSignedIn={false}
      />
    );
  }
  return <PricingClientAuthed brandName={brandName} />;
}

function PricingClientAuthed({ brandName }: { brandName: string }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return (
    <PricingFlow
      brandName={brandName}
      getToken={async () => (await getToken()) ?? null}
      isLoaded={isLoaded}
      isSignedIn={Boolean(isSignedIn)}
    />
  );
}

function PricingFlow({
  brandName,
  getToken,
  isLoaded,
  isSignedIn,
}: { brandName: string } & AuthBag) {
  const [plans, setPlans] = useState<PlanCard[]>(WEB_BILLING_PLANS);
  const [summary, setSummary] = useState<BillingLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const toggleId = useId();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPlans(WEB_BILLING_PLANS);

    try {
      const planRes = await apiFetch<{ plans: PlanCard[]; stripeConfigured?: boolean }>(
        '/v1/billing/plans',
      );
      setPlans(onlyFourPlans(planRes.plans));
    } catch (err) {
      setPlans(WEB_BILLING_PLANS);
      if (!(err instanceof Error && /load failed|failed to fetch|network/i.test(err.message))) {
        setError(err instanceof Error ? err.message : 'Plans failed to load');
      }
    }

    try {
      const token = await getToken();
      if (token) {
        const billing = await apiFetch<BillingLite>('/v1/billing/summary', { token });
        setSummary({
          plan: planById(billing.plan).id,
          planName: planById(billing.plan).name,
          stripeConfigured: billing.stripeConfigured,
          hasCustomer: billing.hasCustomer,
        });
      } else {
        setSummary(null);
      }
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load();
  }, [isLoaded, load]);

  async function startCheckout(planId: string) {
    setError(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) {
        window.location.href = `/sign-up?redirect_url=${encodeURIComponent('/pricing')}`;
        return;
      }
      if (planId === 'enterprise') {
        window.location.href = '/p/about';
        return;
      }
      const res = await apiFetch<{ url: string | null }>('/v1/billing/checkout', {
        method: 'POST',
        token,
        body: JSON.stringify({ planId }),
      });
      if (!res.url) throw new Error('Checkout did not return a URL. Confirm Stripe price IDs are set.');
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  }

  const currentRank = plans.find((p) => p.id === summary?.plan)?.rank ?? -1;

  return (
    <>
      <section className="mkt-hero pricing-hero" aria-labelledby="pricing-hero-title">
        <div className="pricing-hero-glow" aria-hidden="true" />
        <div className="mkt-wrap pricing-hero-inner">
          <p className="mkt-eyebrow">Plans & billing</p>
          <h1 id="pricing-hero-title">
            <span className="mkt-brand-hero">{brandName}</span>
            <span className="mkt-tagline">Pricing that scales with your speech and language stack</span>
          </h1>
          <p className="mkt-hero-lead">
            Four clear plans — Free, Pro, Business, and Enterprise — with character quotas, workspace seats, and
            production entitlements wired to the same billing API as the console.
          </p>
          <div className="mkt-cta-row">
            <Link href="/sign-up" className="vl-btn vl-btn-primary">
              Start free
            </Link>
            <a href="#plans" className="vl-btn vl-btn-secondary">
              Compare plans
            </a>
          </div>
        </div>
      </section>

      <section className="mkt-section pricing-plans-section" id="plans" aria-labelledby="pricing-plans-title">
        <div className="mkt-wrap">
          <div className="pricing-billing-note" role="status">
            <span className="pricing-billing-pill" id={toggleId}>
              Monthly billing
            </span>
            <p>
              Prices are monthly. Annual billing is not available yet — what you see is the live monthly rate.
            </p>
          </div>

          <p className="mkt-kicker">Plans</p>
          <h2 className="mkt-h2" id="pricing-plans-title">
            Choose the plan that fits your workspace
          </h2>
          <p className="mkt-lede">
            Free to explore. Pro for production. Business for multi-workspace volume. Enterprise for SSO and custom
            capacity.
          </p>

          {error ? (
            <p className="pricing-error" role="alert">
              {error}{' '}
              <button type="button" className="pricing-retry" onClick={() => void load()}>
                Retry
              </button>
            </p>
          ) : null}

          {loading && plans.length === 0 ? (
            <p className="pricing-loading">Loading plans…</p>
          ) : null}

          {!loading && plans.length === 0 ? (
            <p className="pricing-empty" role="status">
              No plans available right now. Try again shortly or open{' '}
              <Link href="/billing">Billing</Link>.
            </p>
          ) : (
            <div className="pricing-grid">
              {plans.map((plan, index) => {
                const isCurrent = Boolean(summary && plan.id === summary.plan);
                const isUpgrade = summary ? plan.rank > currentRank : plan.id !== 'free';
                return (
                  <article
                    key={plan.id}
                    className={`pricing-card${plan.highlight ? ' is-highlight' : ''}${isCurrent ? ' is-current' : ''}`}
                    style={{ animationDelay: `${0.06 + index * 0.07}s` }}
                  >
                    <header className="pricing-card-head">
                      <h3>{plan.name}</h3>
                      {plan.highlight ? <span className="pricing-badge">Popular</span> : null}
                      {isCurrent ? <span className="pricing-badge pricing-badge-muted">Current</span> : null}
                    </header>
                    <div className="pricing-price">
                      <span className="pricing-amount">{plan.priceLabel}</span>
                      {plan.priceMonthlyUsd !== null ? (
                        <span className="pricing-period">/ month</span>
                      ) : (
                        <span className="pricing-period">pricing</span>
                      )}
                    </div>
                    <p className="pricing-blurb">{plan.blurb}</p>
                    <p className="pricing-quota">
                      {plan.characterQuota.toLocaleString()} characters / mo ·{' '}
                      {formatWorkspaceLimit(plan.workspaceLimit ?? 1)} workspace
                      {(plan.workspaceLimit ?? 1) === 1 ? '' : 's'}
                    </p>
                    <ul className="pricing-features">
                      {plan.features.map((f) => (
                        <li key={f}>{FEATURE_LABELS[f] ?? f}</li>
                      ))}
                    </ul>
                    <div className="pricing-card-cta">
                      {plan.id === 'free' ? (
                        isCurrent ? (
                          <button type="button" className="vl-btn" disabled>
                            Included
                          </button>
                        ) : (
                          <Link href="/sign-up" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                            Start free
                          </Link>
                        )
                      ) : plan.id === 'enterprise' ? (
                        <Link href="/p/about" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                          Talk to sales
                        </Link>
                      ) : isCurrent ? (
                        <Link href="/billing" className="vl-btn" style={{ textDecoration: 'none' }}>
                          Manage in Billing
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={isUpgrade || !summary ? 'vl-btn vl-btn-primary' : 'vl-btn vl-btn-secondary'}
                          disabled={busy || (Boolean(isSignedIn) && !plan.checkoutAvailable)}
                          onClick={() => void startCheckout(plan.id)}
                        >
                          {!isSignedIn
                            ? `Choose ${plan.name}`
                            : isUpgrade
                              ? `Upgrade to ${plan.name}`
                              : `Switch to ${plan.name}`}
                        </button>
                      )}
                    </div>
                    {isSignedIn &&
                    plan.checkoutAvailable === false &&
                    plan.id !== 'free' &&
                    plan.id !== 'enterprise' ? (
                      <p className="pricing-stripe-hint">
                        Checkout needs Stripe price configuration. You can still review entitlements here.
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          {summary ? (
            <p className="pricing-current-note">
              Signed in on <strong>{summary.planName}</strong>. Manage payment methods in{' '}
              <Link href="/billing">Billing</Link>.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mkt-section mkt-section-mist pricing-compare-section" aria-labelledby="pricing-compare-title">
        <div className="mkt-wrap">
          <p className="mkt-kicker">Compare</p>
          <h2 className="mkt-h2" id="pricing-compare-title">
            Feature comparison
          </h2>
          <p className="mkt-lede">Entitlements from the live plan catalog — what unlocks at each tier.</p>

          <div className="pricing-table-wrap">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th scope="col">Capability</th>
                  {plans.map((p) => (
                    <th key={p.id} scope="col">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{row.label}</th>
                    {plans.map((p) => {
                      const value = cellValue(p, row);
                      const yes = value === 'Yes';
                      return (
                        <td key={p.id} className={yes ? 'is-yes' : value === '—' ? 'is-no' : undefined}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mkt-section pricing-faq-section" aria-labelledby="pricing-faq-title">
        <div className="mkt-wrap pricing-faq-wrap">
          <p className="mkt-kicker">FAQ</p>
          <h2 className="mkt-h2" id="pricing-faq-title">
            Pricing questions
          </h2>
          <div className="pricing-faq-list">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className={`pricing-faq-item${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="pricing-faq-q"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className="pricing-faq-chevron" aria-hidden>
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open ? <p className="pricing-faq-a">{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mkt-section pricing-cta-band" aria-labelledby="pricing-cta-title">
        <div className="mkt-wrap pricing-cta-inner">
          <h2 className="mkt-h2" id="pricing-cta-title">
            Build speaking agents on Lugemi
          </h2>
          <p className="mkt-lede">
            Start on Free, upgrade when you need commercial paths and higher quotas, or talk to us for Enterprise.
          </p>
          <div className="mkt-cta-row">
            <Link href="/sign-up" className="vl-btn vl-btn-primary">
              Create account
            </Link>
            <Link href="/billing" className="vl-btn vl-btn-secondary">
              Open Billing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

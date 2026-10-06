'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import {
  FEATURE_LABELS,
  WEB_BILLING_PLANS,
  formatWorkspaceLimit,
  planById,
  type WebPlan,
} from '@/data/billing-plans';
import { formatCredits } from '@/lib/creative-audio';

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

type BillingSummary = {
  plan: string;
  planName: string;
  characterQuota: number;
  charactersUsed: number;
  charactersRemaining: number;
  stripeConfigured: boolean;
  hasCustomer: boolean;
};

type Tab = 'creative' | 'agents' | 'api';

const CANONICAL = new Set(WEB_BILLING_PLANS.map((p) => p.id));

function onlyFour(plans: PlanCard[]): PlanCard[] {
  const filtered = plans.filter((p) => CANONICAL.has(p.id as WebPlan['id']));
  return filtered.length === 4 ? filtered : WEB_BILLING_PLANS;
}

const AGENTS_FEATURES = [
  'Chat Studio & LugemiAgents',
  'Workflows / Flows automation',
  'Interpreter & Mix corridors',
  'Workspace seats by plan',
];

const API_MODELS = [
  {
    name: 'Echo TTS',
    category: 'Text to Speech',
    price: 'Included',
    unit: 'in character quota',
    blurb: 'Region-aware neural speech via /v1/tts/synthesize.',
    features: ['own:* voices', 'clone:{id} on Pro+', 'MP3 / WAV'],
  },
  {
    name: 'Echo Listen',
    category: 'Speech to Text',
    price: 'Included',
    unit: 'metered minutes',
    blurb: 'ASR via /v1/speech/recognize and /v1/audio/transcriptions.',
    features: ['Vocabulary packs', 'Subtitles', 'Streaming STT'],
  },
  {
    name: 'Baobab MT',
    category: 'Translate',
    price: 'Included',
    unit: 'in character quota',
    blurb: 'Africa-first translation via /v1/translate.',
    features: ['Full locale registry', 'Formats', 'Streaming'],
  },
  {
    name: 'Audio Intelligence',
    category: 'Isolate & enhance',
    price: 'Included',
    unit: 'in plan quotas',
    blurb: 'Energy VAD isolate and enhancement profiles.',
    features: ['Isolate', 'Enhance', 'Analyze'],
  },
];


export function CreativeSubscriptionClient() {
  if (!isClerkConfigured()) {
    return <CreativeSubscriptionClientInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeSubscriptionClientAuthed />;
}

function CreativeSubscriptionClientAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeSubscriptionClientInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeSubscriptionClientInner({ getToken, isLoaded }: { getToken: any; isLoaded: any }) {
  // auth via props: getToken, isLoaded
  const [tab, setTab] = useState<Tab>('creative');
  const [plans, setPlans] = useState<PlanCard[]>(WEB_BILLING_PLANS);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [yearly, setYearly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPlans(WEB_BILLING_PLANS);
    try {
      const planRes = await apiFetch<{ plans: PlanCard[] }>('/v1/billing/plans');
      setPlans(onlyFour(planRes.plans));
    } catch {
      setPlans(WEB_BILLING_PLANS);
    }
    const token = await getToken();
    if (!token) {
      const free = WEB_BILLING_PLANS[0]!;
      setSummary({
        plan: free.id,
        planName: free.name,
        characterQuota: free.characterQuota,
        charactersUsed: 0,
        charactersRemaining: free.characterQuota,
        stripeConfigured: false,
        hasCustomer: false,
      });
      return;
    }
    try {
      const billing = await apiFetch<BillingSummary>('/v1/billing/summary', { token });
      const plan = planById(billing.plan);
      setSummary({
        ...billing,
        plan: plan.id,
        planName: billing.planName || plan.name,
      });
      setError(null);
    } catch (err) {
      const free = WEB_BILLING_PLANS[0]!;
      setSummary({
        plan: free.id,
        planName: free.name,
        characterQuota: free.characterQuota,
        charactersUsed: 0,
        charactersRemaining: free.characterQuota,
        stripeConfigured: false,
        hasCustomer: false,
      });
      if (!(err instanceof Error && /load failed|failed to fetch|network/i.test(err.message))) {
        setError(err instanceof Error ? err.message : 'Billing failed');
      }
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load();
  }, [isLoaded, load]);

  async function startCheckout(planId: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        window.location.href = `/sign-up?redirect_url=${encodeURIComponent('/creative/subscription')}`;
        return;
      }
      if (planId === 'enterprise') {
        window.location.href = '/enterprise';
        return;
      }
      const res = await apiFetch<{ url: string | null }>('/v1/billing/checkout', {
        method: 'POST',
        token,
        body: JSON.stringify({ planId }),
      });
      if (!res.url) throw new Error('Checkout did not return a URL.');
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to manage billing.');
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

  const used = summary?.charactersUsed ?? 0;
  const quota = summary?.characterQuota ?? WEB_BILLING_PLANS[0]!.characterQuota;
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const currentId = summary?.plan ?? 'free';

  return (
    <CreativeShell banner breadcrumb="Subscription">
      <div className="lg-creative-page-head">
        <div>
          <h1>Subscription</h1>
          <p>Credits and plans for LugemiCreative, LugemiAgents, and API — Free, Pro, Business, Enterprise only.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/billing" className="lg-creative-btn">
            Full billing
          </Link>
          <Link href="/pricing" className="lg-creative-btn">
            Pricing
          </Link>
        </div>
      </div>

      <div className="lg-creative-tabs">
        <button type="button" className={tab === 'creative' ? 'is-active' : undefined} onClick={() => setTab('creative')}>
          Creative
        </button>
        <button type="button" className={tab === 'agents' ? 'is-active' : undefined} onClick={() => setTab('agents')}>
          Agents
        </button>
        <button type="button" className={tab === 'api' ? 'is-active' : undefined} onClick={() => setTab('api')}>
          API
        </button>
      </div>

      {error ? <p className="lg-creative-error">{error}</p> : null}

      <div className="lg-creative-cards" style={{ marginBottom: '1.25rem' }}>
        <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
          <h3>Credits used</h3>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--lc-navy)', fontSize: '1.1rem' }}>
              {formatCredits(used)} credits
            </strong>
            {' / '}
            {formatCredits(quota)} credits
          </p>
          <div className="lg-creative-meter" aria-hidden>
            <span style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="lg-creative-btn primary"
              disabled={busy}
              onClick={() => void startCheckout(currentId === 'free' ? 'pro' : currentId)}
            >
              Subscribe
            </button>
            <Link href="/billing" className="lg-creative-btn">
              + Add credits
            </Link>
          </div>
        </div>
        <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
            <h3>You&apos;re currently on {summary?.planName ?? 'Free'} plan</h3>
            <button type="button" className="lg-creative-btn" disabled={busy} onClick={() => void openPortal()}>
              <CreativeIcon name="subscription" width={14} height={14} />
              Billing
            </button>
          </div>
          <p>
            {tab === 'creative'
              ? 'Creative tools draw from your organization character quota (TTS, translate, and related paths).'
              : tab === 'agents'
                ? 'Agents and Chat Studio inherit the same organization plan entitlements and workspace seats.'
                : 'API usage is metered against the same billing summary — no separate Creative SKU.'}
          </p>
        </div>
      </div>

      {tab === 'api' ? (
        <>
          <h2 style={{ margin: '0 0 0.85rem', fontSize: '1.15rem', color: 'var(--lc-navy)' }}>Model pricing</h2>
          <div className="lg-creative-cards">
            {API_MODELS.map((m) => (
              <div key={m.name} className="lg-creative-card">
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--lc-teal)', textTransform: 'uppercase' }}>
                  {m.category}
                </div>
                <h3>{m.name}</h3>
                <p>{m.blurb}</p>
                <div className="price" style={{ fontSize: '1.25rem', fontWeight: 750, color: 'var(--lc-navy)' }}>
                  {m.price} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--lc-muted)' }}>{m.unit}</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                  {m.features.map((f) => (
                    <li key={f} style={{ fontSize: '0.82rem', color: 'var(--lc-muted)' }}>
                      ✓ {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            <div className="lg-creative-toggle" role="group" aria-label="Billing period">
              <button type="button" className={!yearly ? 'is-active' : undefined} onClick={() => setYearly(false)}>
                Monthly
              </button>
              <button type="button" className={yearly ? 'is-active' : undefined} onClick={() => setYearly(true)}>
                Yearly (save 2 months)
              </button>
            </div>
            <Link href="/enterprise" className="lg-creative-btn">
              Talk to Sales
            </Link>
          </div>
          {yearly ? (
            <p className="lg-creative-note" style={{ marginBottom: '1rem' }}>
              Annual billing is not offered yet — checkout uses the live monthly Stripe price. Toggle is informational.
            </p>
          ) : null}

          <div className="lg-creative-plan-grid">
            {plans.map((p) => {
              const isCurrent = p.id === currentId;
              const price =
                p.priceMonthlyUsd == null
                  ? 'Custom'
                  : yearly && p.priceMonthlyUsd > 0
                    ? `$${Math.round((p.priceMonthlyUsd * 10) / 12)}`
                    : p.priceLabel;
              const featureList =
                tab === 'agents'
                  ? AGENTS_FEATURES
                  : p.features.map((f) => FEATURE_LABELS[f] ?? f);
              return (
                <div key={p.id} className={`lg-creative-plan-card${p.highlight ? ' is-popular' : ''}`}>
                  {p.highlight ? <span className="lg-creative-popular">Popular</span> : null}
                  <h3>{p.name}</h3>
                  <div className="price">
                    {price}
                    {p.priceMonthlyUsd != null ? <span> /mo</span> : null}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--lc-muted)', lineHeight: 1.45 }}>{p.blurb}</p>
                  <ul>
                    <li>{formatCredits(p.characterQuota)} characters / mo</li>
                    <li>{formatWorkspaceLimit(p.workspaceLimit ?? 1)} workspaces</li>
                    {featureList.slice(0, 6).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`lg-creative-btn${p.highlight && !isCurrent ? ' primary' : ''}`}
                    disabled={busy || isCurrent || (!p.checkoutAvailable && p.id !== 'enterprise' && p.id !== 'free')}
                    onClick={() => {
                      if (p.id === 'free' || isCurrent) return;
                      void startCheckout(p.id);
                    }}
                  >
                    {isCurrent ? 'Current plan' : p.id === 'enterprise' ? 'Contact sales' : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </CreativeShell>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';
import { isClerkConfigured } from '@/lib/clerk-config';
import {
  FEATURE_LABELS,
  WEB_BILLING_PLANS,
  formatWorkspaceLimit,
  type WebPlan,
} from '@/data/billing-plans';
import {
  EMPTY_ONBOARDING_STATE,
  PERSONA_CARDS,
  PLATFORM_CARDS,
  destinationForPlatform,
  loadOnboardingLocal,
  markOnboardingSkipped,
  saveOnboardingLocal,
  type OnboardingBillingInterval,
  type OnboardingPersona,
  type OnboardingPlanId,
  type OnboardingPlatform,
  type OnboardingState,
} from '@/lib/onboarding';
import {
  setOnboardingStatusCookie,
  setPlatformAdminCookie,
} from '@/lib/onboarding-status';
import './onboarding.css';

const STEPS = 4;
const STEP_LABELS = ['Platform', 'Personalize', 'Persona', 'Plan'] as const;

type ApiProfile = {
  platform: OnboardingPlatform | null;
  displayName: string | null;
  preferredLanguage: string | null;
  referralSource: string | null;
  ageConfirmed: boolean;
  persona: OnboardingPersona | null;
  planId: OnboardingPlanId | null;
  billingInterval: OnboardingBillingInterval;
  completed: boolean;
  step: number;
  destinations?: { creative: string; agents: string };
};

type PlanCard = WebPlan & { checkoutAvailable?: boolean };

function PersonaIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  switch (name) {
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 3l1.2 4.2L17 8.5l-3.8 1.3L12 14l-1.2-4.2L7 8.5l3.8-1.3L12 3z" />
          <path d="M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z" />
        </svg>
      );
    case 'code':
      return (
        <svg {...common}>
          <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 6l-4 12" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18" />
        </svg>
      );
    case 'rocket':
      return (
        <svg {...common}>
          <path d="M12 3c3 2 5 5 5 9 0 2-1 4-2 5l-3 1-3-1c-1-1-2-3-2-5 0-4 2-7 5-9z" />
          <path d="M9 19l-2 2M15 19l2 2M12 14v4" />
        </svg>
      );
    case 'headset':
      return (
        <svg {...common}>
          <path d="M4 14v-2a8 8 0 0116 0v2" />
          <rect x="2" y="14" width="4" height="6" rx="1" />
          <rect x="18" y="14" width="4" height="6" rx="1" />
        </svg>
      );
    case 'store':
      return (
        <svg {...common}>
          <path d="M4 10l2-6h12l2 6M4 10h16v10H4zM9 14h6" />
        </svg>
      );
    case 'grad':
      return (
        <svg {...common}>
          <path d="M2 9l10-5 10 5-10 5L2 9z" />
          <path d="M6 11v5c0 1 3 3 6 3s6-2 6-3v-5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

function FeatureIcon({ name }: { name: string }) {
  return (
    <span className={`ob-feat-icon ob-feat-icon--${name}`} aria-hidden>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
      </svg>
    </span>
  );
}

type AuthBag = {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn: boolean;
};

/** Public entry — avoids useAuth crash when ClerkProvider is not mounted. */
export function OnboardingClient() {
  if (!isClerkConfigured()) {
    return <OnboardingFlow getToken={async () => null} isLoaded isSignedIn={false} />;
  }
  return <OnboardingClientAuthed />;
}

function OnboardingClientAuthed() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return (
    <OnboardingFlow
      getToken={async () => (await getToken()) ?? null}
      isLoaded={isLoaded}
      isSignedIn={Boolean(isSignedIn)}
    />
  );
}

function OnboardingFlow({ getToken, isLoaded, isSignedIn }: AuthBag) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalog = useLocaleCatalog();
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanCard[]>(WEB_BILLING_PLANS);
  const [checkoutNote, setCheckoutNote] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const skipHandled = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const persistLocal = useCallback((next: OnboardingState) => {
    setState(next);
    saveOnboardingLocal(next);
  }, []);

  const saveRemote = useCallback(
    async (patch: Partial<OnboardingState> & { complete?: boolean }) => {
      const token = await getToken();
      if (!token) return null;
      const current = stateRef.current;
      try {
        return await apiFetch<ApiProfile & { persisted?: boolean }>('/v1/onboarding', {
          method: 'POST',
          token,
          body: JSON.stringify({
            platform: patch.platform ?? current.platform,
            displayName: (patch.displayName ?? current.displayName) || null,
            preferredLanguage: (patch.preferredLanguage ?? current.preferredLanguage) || null,
            referralSource: (patch.referralSource ?? current.referralSource) || null,
            ageConfirmed: patch.ageConfirmed ?? current.ageConfirmed,
            persona: patch.persona !== undefined ? patch.persona : current.persona,
            planId: patch.planId !== undefined ? patch.planId : current.planId,
            billingInterval: patch.billingInterval ?? current.billingInterval,
            step: patch.step ?? current.step,
            complete: patch.complete,
          }),
        });
      } catch {
        return null;
      }
    },
    [getToken],
  );

  const skipAll = useCallback(
    async (platform: OnboardingPlatform = 'creative') => {
      setError(null);
      setBusy(true);
      const next = markOnboardingSkipped(platform, stateRef.current);
      persistLocal(next);
      setOnboardingStatusCookie('done');
      await saveRemote({ ...next, complete: true, planId: next.planId ?? 'free' });
      router.replace(destinationForPlatform(platform));
    },
    [persistLocal, router, saveRemote],
  );

  useEffect(() => {
    const local = loadOnboardingLocal();
    setState(local);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !isLoaded) return;
    if (state.completed) {
      setOnboardingStatusCookie('done');
    } else if (isSignedIn) {
      setOnboardingStatusCookie('pending');
    }
  }, [hydrated, isLoaded, isSignedIn, state.completed]);

  useEffect(() => {
    if (!hydrated || !isLoaded || skipHandled.current) return;
    const skip = searchParams.get('skipOnboarding') === '1';
    if (!skip) return;
    skipHandled.current = true;
    const platformParam = searchParams.get('platform');
    const platform: OnboardingPlatform = platformParam === 'agents' ? 'agents' : 'creative';
    void skipAll(platform);
  }, [hydrated, isLoaded, searchParams, skipAll]);

  useEffect(() => {
    if (!isLoaded || !hydrated || skipHandled.current) return;
    void (async () => {
      try {
        const planRes = await apiFetch<{ plans: PlanCard[] }>('/v1/billing/plans');
        if (planRes.plans?.length) {
          const ids = new Set(WEB_BILLING_PLANS.map((p) => p.id));
          const filtered = planRes.plans.filter((p) => ids.has(p.id as OnboardingPlanId));
          setPlans(filtered.length === 4 ? filtered : WEB_BILLING_PLANS);
        }
      } catch {
        setPlans(WEB_BILLING_PLANS);
      }

      const token = await getToken();
      if (!token) return;
      if (skipHandled.current) return;

      // Platform admins skip onboarding entirely: redirect to /admin immediately.
      try {
        const adminRes = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token });
        if (adminRes?.admin) {
          skipHandled.current = true;
          setPlatformAdminCookie(true);
          setOnboardingStatusCookie('done');
          router.replace('/admin');
          return;
        }
        setPlatformAdminCookie(false);
      } catch {
        /* proceed to standard onboarding checks */
      }

      try {
        const remote = await apiFetch<ApiProfile>('/v1/onboarding', { token });
        if (remote.completed) {
          setOnboardingStatusCookie('done');
          router.replace(destinationForPlatform(remote.platform));
          return;
        }
        const local = loadOnboardingLocal();
        if (local.completed) {
          setOnboardingStatusCookie('done');
          router.replace(destinationForPlatform(local.platform));
          return;
        }
        setOnboardingStatusCookie('pending');
        const merged: OnboardingState = {
          ...local,
          platform: remote.platform ?? local.platform,
          displayName: remote.displayName ?? local.displayName,
          preferredLanguage: remote.preferredLanguage ?? local.preferredLanguage ?? 'en',
          referralSource: remote.referralSource ?? local.referralSource,
          ageConfirmed: remote.ageConfirmed || local.ageConfirmed,
          persona: remote.persona ?? local.persona,
          planId: remote.planId ?? local.planId,
          billingInterval: remote.billingInterval ?? 'monthly',
          completed: false,
          step: Math.max(remote.step ?? 0, local.step),
        };
        persistLocal(merged);
      } catch {
        /* local-only ok */
      }
    })();
  }, [isLoaded, hydrated, getToken, persistLocal, router]);

  function go(step: number) {
    persistLocal({ ...state, step });
    void saveRemote({ step });
  }

  async function finish(opts?: { planId?: OnboardingPlanId | null; skipCheckout?: boolean }) {
    setError(null);
    setBusy(true);
    const planId = opts?.planId !== undefined ? opts.planId : state.planId;
    const platform = state.platform ?? 'creative';
    const next: OnboardingState = {
      ...state,
      platform,
      planId,
      completed: true,
      step: STEPS - 1,
    };
    persistLocal(next);
    setOnboardingStatusCookie('done');
    await saveRemote({ ...next, complete: true, planId });

    const paid = planId === 'pro' || planId === 'business';
    if (planId === 'enterprise') {
      setBusy(false);
      router.push('/enterprise');
      return;
    }
    if (paid && !opts?.skipCheckout) {
      setShowCheckout(true);
      setBusy(false);
      return;
    }

    router.push(destinationForPlatform(next.platform));
  }

  async function startCheckout() {
    setError(null);
    setCheckoutNote(null);
    setBusy(true);
    const planId = state.planId;
    if (!planId || planId === 'free' || planId === 'enterprise') {
      setBusy(false);
      router.push(destinationForPlatform(state.platform));
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setCheckoutNote('Sign in to complete Stripe Checkout. Continuing with a local mock.');
        setBusy(false);
        return;
      }
      const res = await apiFetch<{ url: string | null }>('/v1/billing/checkout', {
        method: 'POST',
        token,
        body: JSON.stringify({ planId }),
      });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setCheckoutNote(
        'Stripe Checkout is not configured in this environment. Your plan choice is saved — continue to the workspace.',
      );
    } catch (err) {
      setCheckoutNote(
        err instanceof Error
          ? `${err.message} — plan choice saved locally; continue without live Checkout.`
          : 'Checkout unavailable — continuing with saved plan choice.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="ob-root">
        <p className="ob-loading">Loading…</p>
      </main>
    );
  }

  const step = Math.min(Math.max(state.step, 0), STEPS - 1);
  const selectedPlan = plans.find((p) => p.id === state.planId);

  return (
    <main className="ob-root">
      <header className="ob-top">
        <BrandMark href="/" />
        <div className="ob-top-actions">
          {!showCheckout ? (
            <button
              type="button"
              className="ob-text-btn"
              disabled={busy}
              onClick={() => void skipAll(state.platform ?? 'creative')}
            >
              Skip setup
            </button>
          ) : null}
          {!isSignedIn && isLoaded ? (
            <Link href="/sign-in" className="ob-signin">
              Sign in
            </Link>
          ) : null}
        </div>
      </header>

      <div className="ob-stage" key={showCheckout ? 'checkout' : step}>
        {showCheckout && selectedPlan ? (
          <section className="ob-checkout" aria-labelledby="ob-checkout-title">
            <div className="ob-checkout-summary">
              <p className="ob-eyebrow">Lugemi</p>
              <h1 id="ob-checkout-title">Subscribe to {selectedPlan.name}</h1>
              <p className="ob-checkout-price">
                {selectedPlan.priceLabel}
                {selectedPlan.priceMonthlyUsd != null ? (
                  <span>/ month</span>
                ) : null}
              </p>
              <p className="ob-muted">
                {selectedPlan.blurb} Billing uses Stripe Checkout when configured; otherwise this
                environment keeps a local mock.
              </p>
              <ul className="ob-checkout-lines">
                <li>
                  <span>{selectedPlan.name}</span>
                  <span>{selectedPlan.priceLabel}</span>
                </li>
                <li>
                  <span>Characters / mo</span>
                  <span>{selectedPlan.characterQuota.toLocaleString()}</span>
                </li>
                <li className="ob-checkout-total">
                  <span>Due today</span>
                  <span>{selectedPlan.priceLabel}</span>
                </li>
              </ul>
            </div>
            <div className="ob-checkout-panel">
              <h2>Confirm payment</h2>
              <p className="ob-muted">
                Powered by Stripe when live keys are present. No third-party voice brands — this is
                Lugemi billing.
              </p>
              {checkoutNote ? <p className="ob-note">{checkoutNote}</p> : null}
              <button
                type="button"
                className="vl-btn vl-btn-primary ob-primary"
                disabled={busy}
                onClick={() => void startCheckout()}
              >
                {busy ? 'Opening Checkout…' : 'Continue to Checkout'}
              </button>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy}
                onClick={() => router.push(destinationForPlatform(state.platform))}
              >
                Skip for now
              </button>
            </div>
          </section>
        ) : null}

        {!showCheckout && step === 0 ? (
          <section className="ob-step" aria-labelledby="ob-platform-title">
            <h1 id="ob-platform-title">Choose your platform</h1>
            <p className="ob-sub">Switch between platforms at any time</p>
            <div className="ob-platform-grid">
              {PLATFORM_CARDS.map((card) => {
                const selected = state.platform === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`ob-platform-card${selected ? ' is-selected' : ''} ob-platform-card--${card.id}`}
                    onClick={() => persistLocal({ ...state, platform: card.id })}
                    aria-pressed={selected}
                  >
                    <div className="ob-platform-head">
                      <span className="ob-platform-glyph" aria-hidden />
                      <div>
                        <strong>{card.title}</strong>
                        <p>{card.tagline}</p>
                      </div>
                    </div>
                    <div className="ob-platform-divider" />
                    <p className="ob-features-label">Features</p>
                    <ul className="ob-feature-grid">
                      {card.features.map((f) => (
                        <li key={f.label}>
                          <FeatureIcon name={f.icon} />
                          <span>{f.label}</span>
                          {f.label === 'Flows' ? <em className="ob-new">New</em> : null}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="vl-btn vl-btn-primary ob-primary"
              disabled={!state.platform}
              onClick={() => go(1)}
            >
              Continue
            </button>
            <button
              type="button"
              className="ob-text-btn"
              disabled={busy}
              style={{ marginTop: '0.75rem' }}
              onClick={() => void skipAll(state.platform ?? 'creative')}
            >
              Skip all — go to Studio
            </button>
          </section>
        ) : null}

        {!showCheckout && step === 1 ? (
          <section className="ob-step ob-step-form" aria-labelledby="ob-personalize-title">
            <h1 id="ob-personalize-title">Help us personalize your experience</h1>
            <label className="ob-field">
              <span>What&apos;s your name? (optional)</span>
              <input
                className="vl-field"
                value={state.displayName}
                onChange={(e) => persistLocal({ ...state, displayName: e.target.value })}
                placeholder="Your name or team"
              />
            </label>
            <label className="ob-field">
              <span>What&apos;s your preferred language?</span>
              <LocaleSelect
                value={state.preferredLanguage}
                onChange={(code) => persistLocal({ ...state, preferredLanguage: code || 'en' })}
                languages={catalog.languages}
                locales={catalog.locales}
                dialects={catalog.dialects}
                accents={catalog.accents}
              />
            </label>
            <label className="ob-field">
              <span>How did you hear about us? (optional)</span>
              <input
                className="vl-field"
                value={state.referralSource}
                onChange={(e) => persistLocal({ ...state, referralSource: e.target.value })}
                placeholder="A podcast, workplace, Twitter…"
              />
            </label>
            <label className="ob-check">
              <input
                type="checkbox"
                checked={state.ageConfirmed}
                onChange={(e) => persistLocal({ ...state, ageConfirmed: e.target.checked })}
              />
              <span>
                By checking this box, you confirm you have reached the age of 18 years old (or the age
                of legal majority where you live).
              </span>
            </label>
            <div className="ob-row">
              <button type="button" className="ob-text-btn" onClick={() => go(0)}>
                Back
              </button>
              <button
                type="button"
                className="vl-btn vl-btn-primary"
                disabled={!state.ageConfirmed}
                onClick={() => go(2)}
              >
                Next
              </button>
            </div>
          </section>
        ) : null}

        {!showCheckout && step === 2 ? (
          <section className="ob-step" aria-labelledby="ob-persona-title">
            <h1 id="ob-persona-title">Which one describes you the best?</h1>
            <div className="ob-persona-grid">
              {PERSONA_CARDS.map((p) => {
                const selected = state.persona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`ob-persona-card${selected ? ' is-selected' : ''}`}
                    onClick={() => {
                      const next = { ...state, persona: p.id, step: 3 };
                      persistLocal(next);
                      void saveRemote({ persona: p.id, step: 3 });
                    }}
                    aria-pressed={selected}
                  >
                    <PersonaIcon name={p.icon} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="ob-row ob-row-start">
              <button type="button" className="ob-text-btn" onClick={() => go(1)}>
                Back
              </button>
              <button
                type="button"
                className="ob-text-btn"
                onClick={() => {
                  persistLocal({ ...state, persona: null, step: 3 });
                  go(3);
                }}
              >
                Skip
              </button>
            </div>
          </section>
        ) : null}

        {!showCheckout && step === 3 ? (
          <section className="ob-step ob-step-plans" aria-labelledby="ob-plan-title">
            <div className="ob-plan-head">
              <div>
                <h1 id="ob-plan-title">Choose your plan</h1>
                <p className="ob-sub">Select a plan based on your needs.</p>
              </div>
              <div className="ob-interval" role="group" aria-label="Billing interval">
                <button
                  type="button"
                  className={state.billingInterval === 'monthly' ? 'is-active' : undefined}
                  onClick={() => persistLocal({ ...state, billingInterval: 'monthly' })}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={state.billingInterval === 'yearly' ? 'is-active' : undefined}
                  onClick={() => persistLocal({ ...state, billingInterval: 'yearly' })}
                  title="Yearly billing is not available yet"
                >
                  Yearly
                </button>
                <span className="ob-interval-hint">2 months free*</span>
              </div>
            </div>
            {state.billingInterval === 'yearly' ? (
              <p className="ob-note" role="status">
                Yearly billing is not wired yet — Checkout uses monthly rates when Stripe is
                configured.
              </p>
            ) : null}
            <div className="ob-plan-grid">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={`ob-plan-card${plan.highlight ? ' is-popular' : ''}${
                    state.planId === plan.id ? ' is-selected' : ''
                  }`}
                >
                  {plan.highlight ? <div className="ob-plan-banner">Most Popular</div> : null}
                  <h3>{plan.name}</h3>
                  <p className="ob-plan-price">
                    <strong>{plan.priceLabel}</strong>
                    {plan.priceMonthlyUsd != null ? <span>/month</span> : null}
                  </p>
                  <p className="ob-plan-blurb">{plan.blurb}</p>
                  <p className="ob-plan-meta">
                    {plan.characterQuota.toLocaleString()} chars ·{' '}
                    {formatWorkspaceLimit(plan.workspaceLimit)} workspace
                    {plan.workspaceLimit === 1 ? '' : 's'}
                  </p>
                  <ul>
                    {plan.features.slice(0, 5).map((f) => (
                      <li key={f}>{FEATURE_LABELS[f] ?? f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="vl-btn vl-btn-primary"
                    disabled={busy}
                    onClick={() => {
                      persistLocal({ ...state, planId: plan.id as OnboardingPlanId });
                      void finish({ planId: plan.id as OnboardingPlanId });
                    }}
                  >
                    {plan.id === 'enterprise' ? 'Talk to sales' : 'Select plan'}
                  </button>
                </article>
              ))}
            </div>
            <p className="ob-muted ob-center">
              Pick a plan that matches your volume. Every plan includes a character quota. Upgrade
              anytime under Billing.
            </p>
            <div className="ob-row ob-center-row">
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy}
                onClick={() => void finish({ planId: 'free', skipCheckout: true })}
              >
                Skip
              </button>
              <Link href="/pricing" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                Explore all plans
              </Link>
            </div>
          </section>
        ) : null}
      </div>

      {error ? (
        <p className="ob-error" role="alert">
          {error}
        </p>
      ) : null}

      {!showCheckout ? (
        <nav className="ob-progress" aria-label="Onboarding progress">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={
                i === step ? 'is-current' : i < step ? 'is-done' : undefined
              }
            >
              <em aria-hidden>{i + 1}</em>
              {label}
            </span>
          ))}
        </nav>
      ) : (
        <nav className="ob-progress" aria-label="Checkout">
          <span className="is-current">
            <em aria-hidden>✓</em>
            Checkout
          </span>
        </nav>
      )}
    </main>
  );
}

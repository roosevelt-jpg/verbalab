'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { SITE_CONTENT } from '@/data/site-content';
import { BarChart, LineChart, ProgressRing, seedUsageSeries } from '@/components/stats/stat-charts';
import { FEATURE_LABELS, formatWorkspaceLimit, WEB_BILLING_PLANS } from '@/data/billing-plans';
import { PlanGate } from '@/components/billing/plan-gate';
import {
  PLATFORM_CONNECTORS,
  countConnected,
  loadInstalls,
  type ConnectorInstall,
} from '@/lib/connectors-catalog';
import '@/components/media/anamorphic.css';
import '@/components/stats/stat-charts.css';

type Overview = {
  organization: { id: string; name: string; plan: string; billingStatus: string };
  workspace: { id: string; name: string; defaultSourceLang: string; defaultTargetLang: string } | null;
  workspaces: { id: string; name: string }[];
  workspaceEntitlements?: {
    workspaceLimit: number;
    workspaceUsed: number;
    canCreate: boolean;
    unlimited: boolean;
  };
  billing: {
    planName: string;
    charactersUsed: number;
    characterQuota: number;
    charactersRemaining: number;
    requests: number;
  };
  residency: {
    dataRegion: string | null;
    matchesCurrentDeploy: boolean;
    currentDeploy: { code: string; name: string; residencyLabel: string };
  };
  featureFlags: Record<string, boolean>;
  entitlements?: {
    name: string;
    rank: number;
    features: string[];
    workspaceLimit: number;
    workspaceUsed: number;
    canCreateWorkspace: boolean;
  };
  account: { role: string };
};

const COMMAND_LINKS = [
  { href: '/identity', label: 'Identity', hint: 'Profile & team' },
  { href: '/language-integrity', label: 'Integrity', hint: 'Auth authenticity' },
  { href: '/builders', label: 'Builders', hint: 'Agents · video · keys' },
  { href: '/keys', label: 'API keys', hint: 'lg_live_ / lg_test_' },
  { href: '/chat', label: 'Chat Studio', hint: 'Live dialect chat' },
  { href: '/models', label: 'Models', hint: 'Engine selection' },
  { href: '/translate?source=en&target=ak', label: 'Translate', hint: 'en → Twi' },
  { href: '/data', label: 'Data & branding', hint: 'Logo & residency' },
  { href: '/connectors', label: 'Connectors', hint: 'Plugin installer' },
] as const;

const AFRICA_MISSIONS = [
  {
    id: 'trade',
    title: 'Trade',
    body: 'Negotiate shipping, invoices, and market terms in live dialect — English into Twi, Yorùbá, or Kiswahili without losing tone.',
    href: '/translate?source=en&target=ak',
    cta: 'Translate for trade',
  },
  {
    id: 'negotiate',
    title: 'Negotiate',
    body: 'Voice agents that hold the room: speak back in the dialect your counterpart uses, with clean Lugemi audio — no stacked vendor voice noise.',
    href: '/chat',
    cta: 'Open Chat Studio',
  },
  {
    id: 'educate',
    title: 'Educate',
    body: 'Classroom and training loops with realtime phrase translation. Teachers and learners stay in their language while content stays accurate.',
    href: '/playground?source=en&target=ak',
    cta: 'Try playground demo',
  },
] as const;

const PROFILE_KEY = 'lugemi_workspace_profile_v1';

type ProfileLocal = { displayName: string; imageDataUrl: string | null };

function loadProfile(): ProfileLocal {
  if (typeof window === 'undefined') return { displayName: '', imageDataUrl: null };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { displayName: '', imageDataUrl: null };
    return JSON.parse(raw) as ProfileLocal;
  } catch {
    return { displayName: '', imageDataUrl: null };
  }
}

function saveProfile(p: ProfileLocal) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function DashboardClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installs, setInstalls] = useState<Record<string, ConnectorInstall>>({});
  const [profile, setProfile] = useState<ProfileLocal>({ displayName: '', imageDataUrl: null });
  const welcome = SITE_CONTENT.dashboardWelcome;

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const overview = await apiFetch<Overview>('/v1/cloud/overview', { token });
    setData(overview);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  useEffect(() => {
    setInstalls(loadInstalls());
    setProfile(loadProfile());
  }, []);

  function onProfileImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Profile image must be an image file.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('Profile image must be under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...profile, imageDataUrl: String(reader.result) };
      setProfile(next);
      saveProfile(next);
    };
    reader.readAsDataURL(file);
  }

  const connectedCount = countConnected(installs);
  const voiceVideoConnected = PLATFORM_CONNECTORS.filter(
    (c) => (c.category === 'voice' || c.category === 'video') && installs[c.id]?.connected,
  ).length;

  return (
    <AppShell>
      <div className="lg-workspace-hub">
        <header className="lg-workspace-hero">
          <div className="lg-workspace-hero__copy">
            <p className="lg-workspace-kicker">Lugemi Workspace Console</p>
            <h1 className="lg-workspace-title">{welcome.title}</h1>
            <p className="lg-workspace-lead">{welcome.lead}</p>
            <p className="lg-workspace-sync">
              Voice/video sync stays on Lugemi: one speech path, dialect-true audio, no external voice
              overlay noise in the render chain.
            </p>
            <div className="lg-workspace-hero__ctas">
              <Link href="/chat" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                Live dialect demo
              </Link>
              <Link
                href="/translate?source=en&target=ak"
                className="vl-btn vl-btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                Translate en → Twi
              </Link>
              <Link href="/connectors" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                Install connectors
              </Link>
            </div>
          </div>
          <div className="lg-workspace-hero__side">
            <AnamorphicPanel variant="agents" size="sm" label="Operator home" />
            <section className="lg-workspace-profile" aria-labelledby="dash-profile">
              <h2 id="dash-profile" className="lg-workspace-section-label">
                Profile
              </h2>
              <div className="lg-workspace-profile__row">
                <label className="lg-workspace-avatar" title="Set profile image">
                  {profile.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.imageDataUrl} alt="" />
                  ) : (
                    <span aria-hidden="true">LG</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="lg-workspace-avatar__input"
                    onChange={(e) => onProfileImage(e.target.files?.[0] ?? null)}
                  />
                </label>
                <div>
                  <input
                    className="vl-input"
                    placeholder="Display name"
                    value={profile.displayName}
                    onChange={(e) => {
                      const next = { ...profile, displayName: e.target.value };
                      setProfile(next);
                      saveProfile(next);
                    }}
                    aria-label="Display name"
                  />
                  <p className="lg-workspace-profile__hint">
                    Stored in this browser · full org settings in{' '}
                    <Link href="/identity">Identity</Link>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </header>

        <nav className="lg-workspace-command" aria-label="Workspace command center">
          {COMMAND_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="lg-workspace-command__item">
              <span className="lg-workspace-command__label">{link.label}</span>
              <span className="lg-workspace-command__hint">{link.hint}</span>
            </Link>
          ))}
        </nav>

        <section className="lg-workspace-missions" aria-labelledby="dash-missions">
          <div className="lg-workspace-missions__head">
            <h2 id="dash-missions" className="lg-workspace-section-label">
              Africa-first missions
            </h2>
            <p>
              Trade, negotiate, and educate with real live dialect translations — English into African
              languages with cultural context, not generic MT gloss.
            </p>
          </div>
          <ul className="lg-workspace-missions__list">
            {AFRICA_MISSIONS.map((m) => (
              <li key={m.id}>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
                <Link href={m.href}>{m.cta} →</Link>
              </li>
            ))}
          </ul>
        </section>

        {error ? <p style={{ color: '#b42318', marginBottom: '1rem' }}>{error}</p> : null}
        {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading workspace…</p> : null}

        {data ? (
          <div className="lg-workspace-body">
            <section className="lg-workspace-operator" aria-labelledby="dash-operator">
              <h2 id="dash-operator" className="lg-workspace-section-label">
                Operator overview
              </h2>
              <div className="lg-workspace-operator__strip">
                <div>
                  <span className="lg-workspace-meta">Organization</span>
                  <strong>{data.organization.name}</strong>
                  <span>
                    Plan {data.billing.planName} · {data.account.role} · {data.organization.billingStatus}
                  </span>
                </div>
                <div>
                  <span className="lg-workspace-meta">Workspace</span>
                  <strong>{data.workspace?.name ?? '—'}</strong>
                  <span>
                    Defaults {data.workspace?.defaultSourceLang ?? '—'} →{' '}
                    {data.workspace?.defaultTargetLang ?? '—'} ·{' '}
                    {data.workspaceEntitlements
                      ? `${data.workspaceEntitlements.workspaceUsed}/${formatWorkspaceLimit(data.workspaceEntitlements.workspaceLimit)} workspaces`
                      : `${data.workspaces.length} workspace${data.workspaces.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                <div>
                  <span className="lg-workspace-meta">Usage</span>
                  <strong>
                    {data.billing.charactersUsed.toLocaleString()} /{' '}
                    {data.billing.characterQuota.toLocaleString()}
                  </strong>
                  <span>
                    {data.billing.charactersRemaining.toLocaleString()} left · {data.billing.requests}{' '}
                    requests · <Link href="/billing">Billing</Link>
                  </span>
                </div>
                <div>
                  <span className="lg-workspace-meta">Residency</span>
                  <strong>
                    {data.residency.currentDeploy.name} ({data.residency.currentDeploy.code})
                  </strong>
                  <span>
                    Pin {data.residency.dataRegion ?? 'none'} ·{' '}
                    {data.residency.matchesCurrentDeploy ? 'matches island' : 'use regional API'} ·{' '}
                    <Link href="/data">Data</Link>
                  </span>
                </div>
              </div>
            </section>

            <section className="lg-workspace-connectors-preview" aria-labelledby="dash-connectors">
              <div className="lg-workspace-connectors-preview__head">
                <h2 id="dash-connectors" className="lg-workspace-section-label">
                  Plugin installer
                </h2>
                <p>
                  {connectedCount} connected · {voiceVideoConnected} voice/video · Twilio, VAPI, Google
                  Voice, Higgsfield, Google Video, and office stacks — one API integration each.
                </p>
                <Link href="/connectors" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                  Open installer
                </Link>
              </div>
              <ul className="lg-workspace-connectors-preview__list">
                {PLATFORM_CONNECTORS.filter((c) => c.category === 'voice' || c.category === 'video')
                  .slice(0, 6)
                  .map((c) => {
                    const on = Boolean(installs[c.id]?.connected);
                    return (
                      <li key={c.id} className={on ? 'is-on' : undefined}>
                        <strong>{c.name}</strong>
                        <span>{c.category}</span>
                        <em>{on ? 'Connected' : 'Install'}</em>
                      </li>
                    );
                  })}
              </ul>
            </section>

            <section className="vl-endpoint-card" aria-labelledby="dash-stats">
              <h2 id="dash-stats" className="lg-workspace-section-label">
                Workspace health
              </h2>
              <div className="lg-stats-grid">
                <ProgressRing
                  value={data.billing.charactersUsed}
                  max={data.billing.characterQuota}
                  label="Character balance"
                  sublabel={`${data.billing.charactersRemaining.toLocaleString()} left this period`}
                />
                <ProgressRing
                  value={Math.min(data.billing.requests, 500)}
                  max={500}
                  label="Request pace"
                  sublabel={`${data.billing.requests.toLocaleString()} translate/speech calls`}
                />
                <LineChart
                  title="Usage timeline"
                  series={seedUsageSeries(data.billing.charactersUsed, data.billing.requests)}
                />
                <BarChart
                  title="Feature mix (illustrative)"
                  bars={[
                    { label: 'Speech', value: Math.max(12, Math.round(data.billing.requests * 0.4)) },
                    { label: 'Translate', value: Math.max(8, Math.round(data.billing.requests * 0.35)) },
                    { label: 'Agents', value: Math.max(4, Math.round(data.billing.requests * 0.15)) },
                    { label: 'Studio', value: Math.max(3, Math.round(data.billing.requests * 0.1)) },
                  ]}
                />
              </div>
            </section>

            <section className="vl-endpoint-card" aria-labelledby="dash-entitlements">
              <h2 id="dash-entitlements" className="lg-workspace-section-label">
                Workspace entitlements
              </h2>
              <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                This workspace inherits your {data.billing.planName} subscription — features unlock with
                the plan, tiered.
              </p>
              <ul className="lg-workspace-flags">
                {WEB_BILLING_PLANS.flatMap((p) => p.features)
                  .filter((f, i, arr) => arr.indexOf(f) === i)
                  .map((feature) => {
                    const on =
                      data.entitlements?.features.includes(feature) ??
                      Boolean(data.featureFlags[feature]);
                    return (
                      <li key={feature} className="vl-tag" style={{ opacity: on ? 1 : 0.5 }}>
                        <span>{FEATURE_LABELS[feature] ?? feature}</span>
                        <span style={{ fontWeight: 700 }}>{on ? 'On' : 'Locked'}</span>
                      </li>
                    );
                  })}
              </ul>
              <div style={{ marginTop: '0.85rem' }}>
                <PlanGate
                  feature="marketplace"
                  currentPlan={data.organization.plan}
                  allowed={data.featureFlags.marketplace}
                  compact
                />
              </div>
            </section>

            <section className="vl-player-bar" aria-label="Quick demos">
              <Link href="/docs" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                API docs
              </Link>
              <Link href="/playground" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                Playground
              </Link>
              <Link href="/audio" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none' }}>
                Voice Studio
              </Link>
              <Link href="/voice" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                Speaking agents
              </Link>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

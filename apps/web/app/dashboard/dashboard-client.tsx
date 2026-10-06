'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { SITE_CONTENT } from '@/data/site-content';
import { BarChart, LineChart, ProgressRing, seedUsageSeries } from '@/components/stats/stat-charts';
import {
  ActivityBoard,
  HeatList,
  PipelineStrip,
  StatusRing,
  UsageMeter,
} from '@/components/stats/activity-visuals';
import {
  FEATURE_LABELS,
  FEATURE_MIN_PLAN,
  formatWorkspaceLimit,
  planById,
  WEB_BILLING_PLANS,
} from '@/data/billing-plans';
import { PlanGate } from '@/components/billing/plan-gate';
import {
  PLATFORM_CONNECTORS,
  countConnected,
  loadInstalls,
  saveInstalls,
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
    planFeatures?: string[];
    workspaceLimit: number;
    workspaceUsed: number;
    canCreateWorkspace: boolean;
  };
  account: { role: string };
};

type IdentityOverview = {
  profile?: { name: string | null; email: string | null };
  organization: { name: string; plan: string };
  session: { role: string };
};

type UsageSummary = {
  periodStart: string;
  requests: number;
  characters: number;
  translate?: { requests: number; characters: number };
  stt?: { requests: number; seconds: number; minutes: number };
  tts?: { requests: number; characters: number };
  chat?: { requests: number; tokens: number };
  embeddings?: { requests: number; tokens: number };
};

type AnalyticsOverview = {
  byFeature: Array<{ feature: string; requests: number; units: number }>;
  byLanguagePair: Array<{ source: string; target: string; requests: number; characters: number }>;
};

/** Generic connector tiles — Lugemi capability labels, no third-party brand names. */
const CONNECTOR_TILES = [
  { id: 'twilio', label: 'Telephony bridge', category: 'Voice', hint: 'PSTN / messaging voice path' },
  { id: 'vapi', label: 'Voice agent runtime', category: 'Voice', hint: 'Realtime agent speech layer' },
  { id: 'livekit', label: 'Realtime rooms', category: 'Voice', hint: 'Low-latency room audio' },
  { id: 'retell', label: 'Outbound dialer agents', category: 'Voice', hint: 'Campaign-style voice loops' },
  { id: 'higgsfield', label: 'Lip-sync video bed', category: 'Video', hint: 'Voice-led video render' },
  { id: 'google-video', label: 'Localized video export', category: 'Video', hint: 'Dialect-true media out' },
] as const;

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
    body: 'Voice agents that hold the room: speak back in the dialect your counterpart uses, with Lugemi Echo Voice.',
    href: '/chat',
    cta: 'Open Chat Studio',
  },
  {
    id: 'educate',
    title: 'Educate',
    body: 'Classroom and training loops with realtime phrase translation. Teachers and learners stay in their language.',
    href: '/playground?source=en&target=ak',
    cta: 'Try playground demo',
  },
] as const;

const ENTITLEMENT_FEATURES = WEB_BILLING_PLANS.flatMap((p) => p.features).filter(
  (f, i, arr) => arr.indexOf(f) === i,
);

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

function featureOn(data: Overview, feature: string): boolean {
  if (typeof data.featureFlags[feature] === 'boolean') return data.featureFlags[feature]!;
  return (
    data.entitlements?.features.includes(feature) ??
    Boolean(data.entitlements?.planFeatures?.includes(feature))
  );
}

function featureOnPlan(data: Overview, feature: string): boolean {
  if (data.entitlements?.planFeatures?.includes(feature)) return true;
  return planById(data.organization.plan).features.includes(feature);
}

export function DashboardClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [identity, setIdentity] = useState<IdentityOverview | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggleBusy, setToggleBusy] = useState<string | null>(null);
  const [installs, setInstalls] = useState<Record<string, ConnectorInstall>>({});
  const [profile, setProfile] = useState<ProfileLocal>({ displayName: '', imageDataUrl: null });
  const welcome = SITE_CONTENT.dashboardWelcome;

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [overview, idRes, usageRes, analyticsRes] = await Promise.all([
      apiFetch<Overview>('/v1/cloud/overview', { token }),
      apiFetch<IdentityOverview>('/v1/identity/overview', { token }).catch(() => null),
      apiFetch<UsageSummary>('/v1/usage/summary', { token }).catch(() => null),
      apiFetch<AnalyticsOverview>('/v1/analytics/overview', { token }).catch(() => null),
    ]);
    setData(overview);
    setIdentity(idRes);
    setUsage(usageRes);
    setAnalytics(analyticsRes);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  useEffect(() => {
    setInstalls(loadInstalls());
    setProfile(loadProfile());
  }, []);

  useEffect(() => {
    if (!identity?.profile?.name) return;
    setProfile((prev) => {
      if (prev.displayName.trim()) return prev;
      const next = { ...prev, displayName: identity.profile?.name ?? '' };
      saveProfile(next);
      return next;
    });
  }, [identity]);

  const displayName = useMemo(() => {
    if (profile.displayName.trim()) return profile.displayName.trim();
    return identity?.profile?.name?.trim() || identity?.profile?.email || 'Operator';
  }, [profile.displayName, identity]);

  const connectedCount = countConnected(installs);
  const voiceVideoConnected = PLATFORM_CONNECTORS.filter(
    (c) => (c.category === 'voice' || c.category === 'video') && installs[c.id]?.connected,
  ).length;

  const charsUsed = data?.billing.charactersUsed ?? usage?.characters ?? 0;
  const charQuota = data?.billing.characterQuota ?? 0;
  const charsRemaining = data?.billing.charactersRemaining ?? Math.max(0, charQuota - charsUsed);
  const requestCount =
    data?.billing.requests ??
    usage?.requests ??
    (usage
      ? (usage.translate?.requests ?? 0) +
        (usage.stt?.requests ?? 0) +
        (usage.tts?.requests ?? 0) +
        (usage.chat?.requests ?? 0)
      : 0);
  const hasUsage = charsUsed > 0 || requestCount > 0;

  const featureBars = useMemo(() => {
    if (analytics?.byFeature?.length) {
      const wanted = [
        { key: /speech|stt|tts|audio/i, label: 'Speech' },
        { key: /translate|mt/i, label: 'Translate' },
        { key: /agent|voice|chat/i, label: 'Agents' },
        { key: /studio|playground|console/i, label: 'Studio' },
      ];
      return wanted.map(({ key, label }) => {
        const sum = analytics.byFeature
          .filter((f) => key.test(f.feature))
          .reduce((acc, f) => acc + f.requests, 0);
        return { label, value: sum };
      });
    }
    if (!usage) return [
      { label: 'Speech', value: 0 },
      { label: 'Translate', value: 0 },
      { label: 'Agents', value: 0 },
      { label: 'Studio', value: 0 },
    ];
    return [
      { label: 'Speech', value: (usage.stt?.requests ?? 0) + (usage.tts?.requests ?? 0) },
      { label: 'Translate', value: usage.translate?.requests ?? 0 },
      { label: 'Agents', value: usage.chat?.requests ?? 0 },
      { label: 'Studio', value: usage.embeddings?.requests ?? 0 },
    ];
  }, [analytics, usage]);

  const localeHeat = useMemo(() => {
    if (analytics?.byLanguagePair?.length) {
      return analytics.byLanguagePair.slice(0, 4).map((pair, i) => ({
        id: `${pair.source}-${pair.target}-${i}`,
        label: `${pair.source} → ${pair.target}`,
        value: pair.requests,
        hint: `${pair.characters.toLocaleString()} chars`,
      }));
    }
    const src = data?.workspace?.defaultSourceLang ?? 'en';
    const tgt = data?.workspace?.defaultTargetLang ?? 'ak';
    if (!hasUsage) {
      return [
        { id: 'src', label: src, value: 0, hint: 'source default' },
        { id: 'tgt', label: tgt, value: 0, hint: 'target default' },
        { id: 'ak', label: 'ak · Twi', value: 0, hint: 'Africa focus' },
      ];
    }
    return [
      {
        id: 'src',
        label: src,
        value: Math.max(1, Math.round(requestCount * 0.55)),
        hint: 'source',
      },
      {
        id: 'tgt',
        label: tgt,
        value: Math.max(1, Math.round(requestCount * 0.7)),
        hint: 'target',
      },
      {
        id: 'ak',
        label: 'ak · Twi',
        value: Math.max(1, Math.round(requestCount * 0.45)),
        hint: 'Africa focus',
      },
    ];
  }, [analytics, data, hasUsage, requestCount]);

  const usageSeries = hasUsage ? seedUsageSeries(charsUsed, requestCount) : Array.from({ length: 14 }, () => 0);

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

  function quickInstall(id: string) {
    const next: ConnectorInstall = {
      ...(installs[id] ?? { connected: false }),
      connected: true,
      connectedAt: Date.now(),
    };
    const map = { ...installs, [id]: next };
    setInstalls(map);
    saveInstalls(map);
  }

  async function toggleEntitlement(feature: string, enabled: boolean) {
    if (!data) return;
    if (!featureOnPlan(data, feature)) return;
    if (data.account.role !== 'owner' && data.account.role !== 'admin') {
      setError('Only owners and admins can change workspace entitlements.');
      return;
    }
    setToggleBusy(feature);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        flags: Record<string, boolean>;
        entitlements: Overview['entitlements'];
      }>('/v1/feature-flags', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ overrides: { [feature]: enabled } }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              featureFlags: { ...prev.featureFlags, ...res.flags },
              entitlements: res.entitlements ?? prev.entitlements,
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update entitlement');
    } finally {
      setToggleBusy(null);
    }
  }

  const canManageFlags = data?.account.role === 'owner' || data?.account.role === 'admin';

  return (
    <AppShell>
      <div className="lg-workspace-hub">
        <header className="lg-workspace-hero">
          <div className="lg-workspace-hero__copy">
            <p className="lg-workspace-brand">Lugemi</p>
            <p className="lg-workspace-kicker">Workspace Console</p>
            <h1 className="lg-workspace-title">{welcome.title}</h1>
            <p className="lg-workspace-lead">
              Calm command center for Africa-first language intelligence — identity, usage, connectors,
              and dialect demos in one place.
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
            </div>
          </div>
          <div className="lg-workspace-hero__side">
            <AnamorphicPanel variant="voice" size="sm" label="Operator home" />
            <section className="lg-workspace-profile" aria-labelledby="dash-profile">
              <h2 id="dash-profile" className="lg-workspace-section-label">
                Identity
              </h2>
              <div className="lg-workspace-profile__row">
                <label className="lg-workspace-avatar" title="Set profile image">
                  {profile.imageDataUrl ? (
                    <img src={profile.imageDataUrl} alt="" />
                  ) : (
                    <span aria-hidden="true">
                      {(displayName.slice(0, 2) || 'LG').toUpperCase()}
                    </span>
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
                    {identity?.organization.name
                      ? `${identity.organization.name} · `
                      : null}
                    <Link href="/identity">Identity settings</Link>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </header>

        {error ? <p className="lg-workspace-error">{error}</p> : null}
        {!data && !error ? <p className="lg-workspace-loading">Loading workspace…</p> : null}

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
                    {charsUsed.toLocaleString()} / {charQuota.toLocaleString()}
                  </strong>
                  <span>
                    {charsRemaining.toLocaleString()} left · {requestCount.toLocaleString()} requests ·{' '}
                    <Link href="/billing">Billing</Link>
                    {' · '}
                    <Link href="/usage">Usage</Link>
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

            <nav className="lg-workspace-command" aria-label="Workspace modules">
              {COMMAND_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="lg-workspace-command__item">
                  <span className="lg-workspace-command__label">{link.label}</span>
                  <span className="lg-workspace-command__hint">{link.hint}</span>
                </Link>
              ))}
            </nav>

            <section className="lg-workspace-connectors-preview" aria-labelledby="dash-connectors">
              <div className="lg-workspace-connectors-preview__head">
                <h2 id="dash-connectors" className="lg-workspace-section-label">
                  Plugin installer
                </h2>
                <p>
                  {connectedCount} connected · {voiceVideoConnected} voice/video paths. Install Lugemi
                  speech bridges into your stack — one integration each.
                </p>
                <Link href="/connectors" className="vl-btn vl-btn-primary" style={{ textDecoration: 'none' }}>
                  Open installer
                </Link>
              </div>
              <ul className="lg-workspace-connectors-preview__list">
                {CONNECTOR_TILES.map((tile) => {
                  const on = Boolean(installs[tile.id]?.connected);
                  return (
                    <li key={tile.id} className={on ? 'is-on' : undefined}>
                      <strong>{tile.label}</strong>
                      <span>{tile.category}</span>
                      {on ? (
                        <Link href={`/connectors#${tile.id}`}>Connected</Link>
                      ) : (
                        <button
                          type="button"
                          className="lg-workspace-install-btn"
                          onClick={() => quickInstall(tile.id)}
                        >
                          Install
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <ActivityBoard kicker="System activity" title="Live workspace pulse">
              <PipelineStrip
                title="Language intelligence path"
                stages={[
                  { id: 'ingest', label: 'Ingest', state: requestCount > 0 ? 'ready' : 'idle' },
                  { id: 'route', label: 'Route', state: data.workspace ? 'ready' : 'idle' },
                  { id: 'model', label: 'Model', state: requestCount > 0 ? 'active' : 'ready' },
                  {
                    id: 'deliver',
                    label: 'Deliver',
                    state:
                      data.organization.billingStatus === 'active' ||
                      data.organization.billingStatus === 'trialing'
                        ? 'ready'
                        : 'idle',
                  },
                ]}
              />
              <div className="lg-studio-overview">
                <UsageMeter
                  label="Character quota"
                  value={charsUsed}
                  max={Math.max(charQuota, 1)}
                  unit="chars"
                />
                <UsageMeter
                  label="Request pace"
                  value={Math.min(requestCount, 500)}
                  max={500}
                  unit="calls"
                />
                <StatusRing
                  status={
                    data.residency.matchesCurrentDeploy
                      ? 'ok'
                      : data.residency.dataRegion
                        ? 'warn'
                        : 'idle'
                  }
                  label="Residency"
                  detail={`${data.residency.currentDeploy.code} · pin ${data.residency.dataRegion ?? 'none'}`}
                />
                <StatusRing
                  status={connectedCount > 0 ? 'ok' : 'idle'}
                  label="Connectors"
                  detail={`${connectedCount} connected · ${voiceVideoConnected} voice/video`}
                />
              </div>
              {hasUsage ? (
                <div className="lg-stats-grid">
                  <ProgressRing
                    value={charsUsed}
                    max={Math.max(charQuota, 1)}
                    label="Character balance"
                    sublabel={`${charsRemaining.toLocaleString()} left this period`}
                  />
                  <LineChart title="Usage timeline" series={usageSeries} />
                  <BarChart title="Feature mix" bars={featureBars} />
                  <HeatList title="Locale defaults heat" items={localeHeat} />
                </div>
              ) : (
                <p className="lg-workspace-empty">
                  No usage yet this period. Run a translate or speech call — metrics fill from billing,
                  usage, and analytics APIs.
                </p>
              )}
            </ActivityBoard>

            <section className="lg-workspace-entitlements" aria-labelledby="dash-entitlements">
              <h2 id="dash-entitlements" className="lg-workspace-section-label">
                Workspace entitlements
              </h2>
              <p className="lg-workspace-entitlements__lead">
                Features unlocked by your {data.billing.planName} plan. Toggle on/off for this workspace
                {canManageFlags ? '' : ' (owners and admins can change)'}.
              </p>
              <ul className="lg-workspace-flags">
                {ENTITLEMENT_FEATURES.map((feature) => {
                  const onPlan = featureOnPlan(data, feature);
                  const on = featureOn(data, feature);
                  const locked = !onPlan;
                  const busy = toggleBusy === feature;
                  const minPlan = FEATURE_MIN_PLAN[feature];
                  return (
                    <li key={feature} className={`lg-workspace-flag${locked ? ' is-locked' : ''}`}>
                      <div className="lg-workspace-flag__copy">
                        <span className="lg-workspace-flag__label">
                          {FEATURE_LABELS[feature] ?? feature}
                        </span>
                        {locked ? (
                          <span className="lg-workspace-flag__hint">
                            Requires {minPlan ? planById(minPlan).name : 'upgrade'} ·{' '}
                            <Link href="/billing">Upgrade</Link>
                          </span>
                        ) : (
                          <span className="lg-workspace-flag__hint">
                            {on ? 'Enabled for this workspace' : 'Disabled for this workspace'}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={locked ? false : on}
                        aria-label={`${FEATURE_LABELS[feature] ?? feature}${locked ? ' (plan locked)' : ''}`}
                        className={`lg-toggle${on && !locked ? ' is-on' : ''}`}
                        disabled={locked || busy || !canManageFlags}
                        onClick={() => void toggleEntitlement(feature, !on)}
                      >
                        <span className="lg-toggle__thumb" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="lg-workspace-entitlements__gate">
                <PlanGate
                  feature="marketplace"
                  currentPlan={data.organization.plan}
                  allowed={data.featureFlags.marketplace}
                  compact
                />
              </div>
            </section>

            <section className="lg-workspace-missions" aria-labelledby="dash-missions">
              <div className="lg-workspace-missions__head">
                <h2 id="dash-missions" className="lg-workspace-section-label">
                  Africa-first missions
                </h2>
                <p>
                  Trade, negotiate, and educate with live dialect translations — cultural context, not
                  generic MT gloss.
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

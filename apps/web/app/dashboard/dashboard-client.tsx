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

const QUICK_LINKS = [
  { href: '/voice', label: 'Speaking agents', primary: true },
  { href: '/audio', label: 'Voice Studio', primary: false },
  { href: '/agent-runtime', label: 'Agent Runtime', primary: false },
  { href: '/playground', label: 'API playground', primary: false },
  { href: '/docs', label: 'API docs', primary: false },
  { href: '/keys', label: 'API keys', primary: false },
];

export function DashboardClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <AppShell>
      <div className="lg-hub-hero">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.85rem',
              fontWeight: 720,
              letterSpacing: '-0.03em',
              margin: '0 0 0.35rem',
              color: 'var(--brand-navy)',
            }}
          >
            {welcome.title}
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '40rem', lineHeight: 1.6 }}>{welcome.lead}</p>
        </div>
        <AnamorphicPanel variant="agents" size="sm" label="Console depth" />
      </div>

      <section
        className="vl-endpoint-card"
        style={{ marginBottom: '1.25rem' }}
        aria-labelledby="dash-starters"
      >
        <h2
          id="dash-starters"
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            margin: '0 0 0.75rem',
            fontWeight: 700,
          }}
        >
          Starter paths
        </h2>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          }}
        >
          {welcome.starterCards.map((card) => (
            <li key={card.href} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
              <Link href={card.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{card.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: 1.45 }}>
                  {card.body}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {error ? <p style={{ color: '#b42318', marginBottom: '1rem' }}>{error}</p> : null}

      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading workspace…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
            }}
          >
            <section className="vl-endpoint-card">
              <h2 style={sectionLabel}>Organization</h2>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--brand-navy)' }}>
                {data.organization.name}
              </p>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Plan {data.billing.planName} · {data.account.role} · billing {data.organization.billingStatus}
              </p>
            </section>

            <section className="vl-endpoint-card">
              <h2 style={sectionLabel}>Workspace</h2>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--brand-navy)' }}>
                {data.workspace?.name ?? '—'}
              </p>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Defaults {data.workspace?.defaultSourceLang ?? '—'} → {data.workspace?.defaultTargetLang ?? '—'} ·{' '}
                {data.workspaceEntitlements
                  ? `${data.workspaceEntitlements.workspaceUsed}/${formatWorkspaceLimit(data.workspaceEntitlements.workspaceLimit)} workspaces`
                  : `${data.workspaces.length} workspace${data.workspaces.length === 1 ? '' : 's'}`}
              </p>
            </section>

            <section className="vl-endpoint-card">
              <h2 style={sectionLabel}>Usage this period</h2>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--brand-navy)' }}>
                {data.billing.charactersUsed.toLocaleString()} / {data.billing.characterQuota.toLocaleString()}{' '}
                characters
              </p>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                {data.billing.charactersRemaining.toLocaleString()} remaining · {data.billing.requests} requests
              </p>
              <p style={{ margin: '0.65rem 0 0' }}>
                <Link href="/billing" style={{ color: 'var(--action-primary)', fontWeight: 550 }}>
                  Billing →
                </Link>
              </p>
            </section>

            <section className="vl-endpoint-card">
              <h2 style={sectionLabel}>Residency</h2>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--brand-navy)' }}>
                Deploy {data.residency.currentDeploy.name} ({data.residency.currentDeploy.code})
              </p>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Pin {data.residency.dataRegion ?? 'none'} ·{' '}
                {data.residency.matchesCurrentDeploy ? 'matches this island' : 'mismatch — use regional API'}
              </p>
              <p style={{ margin: '0.65rem 0 0' }}>
                <Link href="/data" style={{ color: 'var(--action-primary)', fontWeight: 550 }}>
                  Data & residency →
                </Link>
              </p>
            </section>
          </div>

          <section className="vl-endpoint-card" aria-labelledby="dash-stats">
            <h2 id="dash-stats" style={sectionLabel}>
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
            <h2 id="dash-entitlements" style={sectionLabel}>
              Workspace entitlements
            </h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              This workspace inherits your {data.billing.planName} subscription — features unlock with the plan,
              ElevenLabs-style.
            </p>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'grid',
                gap: '0.45rem',
                gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
              }}
            >
              {WEB_BILLING_PLANS.flatMap((p) => p.features)
                .filter((f, i, arr) => arr.indexOf(f) === i)
                .map((feature) => {
                  const on =
                    data.entitlements?.features.includes(feature) ??
                    Boolean(data.featureFlags[feature]);
                  return (
                    <li
                      key={feature}
                      className="vl-tag"
                      style={{
                        opacity: on ? 1 : 0.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
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

          <section className="vl-endpoint-card">
            <h2 style={sectionLabel}>Feature flags</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(data.featureFlags).map(([key, on]) => (
                <li key={key} className="vl-tag" style={{ opacity: on ? 1 : 0.55 }}>
                  {key}
                </li>
              ))}
            </ul>
          </section>

          <section className="vl-player-bar">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`vl-btn ${link.primary ? 'vl-btn-primary' : 'vl-btn-secondary'}`}
                style={{ textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.55rem',
  fontWeight: 700,
};

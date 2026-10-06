'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Overview = {
  organization: { id: string; name: string; plan: string; billingStatus: string };
  workspace: { id: string; name: string; defaultSourceLang: string; defaultTargetLang: string } | null;
  workspaces: { id: string; name: string }[];
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
  account: { role: string };
};

const QUICK_LINKS = [
  { href: '/translate', label: 'Translate', primary: true },
  { href: '/audio', label: 'Voice Studio', primary: false },
  { href: '/playground', label: 'API playground', primary: false },
  { href: '/docs', label: 'API docs', primary: false },
  { href: '/keys', label: 'API keys', primary: false },
  { href: '/developers', label: 'Developers', primary: false },
];

export function DashboardClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        Dashboard
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '36rem', lineHeight: 1.6 }}>
        Organization, workspace, residency, and plan at a glance. Product work happens in Translate, Voice Studio, and
        the Lugemi API console.
      </p>

      {error ? <p style={{ color: '#b42318', marginBottom: '1rem' }}>{error}</p> : null}

      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

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
                {data.workspaces.length} workspace{data.workspaces.length === 1 ? '' : 's'}
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

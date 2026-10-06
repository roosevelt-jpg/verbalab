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
        }}
      >
        Cloud dashboard
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '36rem' }}>
        Organization, workspace, residency, and plan at a glance. Product work happens in Translate,
        Voice Studio, and the rest of the console.
      </p>

      {error ? (
        <p style={{ color: '#b42318', marginBottom: '1rem' }}>{error}</p>
      ) : null}

      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section>
            <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
              Organization
            </h2>
            <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{data.organization.name}</p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Plan {data.billing.planName} · {data.account.role} · billing {data.organization.billingStatus}
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
              Workspace
            </h2>
            <p style={{ margin: 0, fontWeight: 600 }}>{data.workspace?.name ?? '—'}</p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Defaults {data.workspace?.defaultSourceLang ?? '—'} → {data.workspace?.defaultTargetLang ?? '—'} ·{' '}
              {data.workspaces.length} workspace{data.workspaces.length === 1 ? '' : 's'}
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
              Usage this period
            </h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {data.billing.charactersUsed.toLocaleString()} / {data.billing.characterQuota.toLocaleString()} characters
            </p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {data.billing.charactersRemaining.toLocaleString()} remaining · {data.billing.requests} requests
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href="/billing" style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Billing →
              </Link>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
              Residency
            </h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Deploy {data.residency.currentDeploy.name} ({data.residency.currentDeploy.code})
            </p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Pin {data.residency.dataRegion ?? 'none'} ·{' '}
              {data.residency.matchesCurrentDeploy ? 'matches this island' : 'mismatch — use regional API'}
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href="/data" style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Data & residency →
              </Link>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
              Feature flags
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(data.featureFlags).map(([key, on]) => (
                <li
                  key={key}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '0.35rem',
                    background: on ? 'var(--bg-soft)' : 'transparent',
                    border: '1px solid var(--line)',
                    color: on ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {key}
                </li>
              ))}
            </ul>
          </section>

          <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <Link
              href="/translate"
              style={{
                textDecoration: 'none',
                padding: '0.65rem 1.1rem',
                background: 'var(--ink)',
                color: '#fff',
                borderRadius: '0.45rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Translate
            </Link>
            <Link
              href="/audio"
              style={{
                textDecoration: 'none',
                padding: '0.65rem 1.1rem',
                border: '1px solid var(--line)',
                borderRadius: '0.45rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--ink)',
              }}
            >
              Voice Studio
            </Link>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

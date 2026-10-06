'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Overview = {
  session: { role: string };
  platformAdmin: boolean;
  workspaces: { id: string; name: string; isCurrent: boolean }[];
  residency: {
    dataRegion: string | null;
    matchesCurrentDeploy: boolean;
    currentDeploy: { code: string; name: string };
  };
  policies: {
    organization: {
      security: { orgDisabled: boolean; apiKeysActive: number; abac: boolean };
      compliance: {
        retentionDays: number | null;
        persistSourceText: boolean;
        allowVendorTraining: boolean;
        automatedRetentionSweeper: boolean;
        certificationsProduct: boolean;
      };
      billing: {
        planName: string;
        charactersUsed: number;
        characterQuota: number;
        charactersRemaining: number;
      };
      cloud: { deployRegion: string; dataRegionPin: string | null; availabilityZones: boolean };
      governance: { members: number; workspaces: number };
    };
  };
  links: Record<string, string>;
};

export function EnterpriseClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/enterprise/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const p = data?.policies.organization;

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
        Enterprise console
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '40rem' }}>
        Derived controls for this organization — governance, security, billing quotas, and residency.
        Plan details and sales: <Link href="/enterprise" style={{ color: 'var(--accent)' }}>Enterprise</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data && p ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <section>
            <h2 style={label}>Your role</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>{data.session.role}</p>
            {data.platformAdmin ? (
              <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                Platform admin allowlist ·{' '}
                <Link href={(data.links.admin) ?? '#'} style={{ color: 'var(--accent)' }}>
                  Admin console
                </Link>
              </p>
            ) : null}
          </section>

          <section>
            <h2 style={label}>Security</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {p.security.orgDisabled ? 'Organization disabled' : 'Organization active'} ·{' '}
              {p.security.apiKeysActive} active API keys · ABAC {p.security.abac ? 'on' : 'off'}
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href={(data.links.identity) ?? '#'} style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Identity & RBAC →
              </Link>
            </p>
          </section>

          <section>
            <h2 style={label}>Compliance & data</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Retention {p.compliance.retentionDays ?? 'unlimited'} · Persist source{' '}
              {p.compliance.persistSourceText ? 'on' : 'off'} · Vendor training{' '}
              {p.compliance.allowVendorTraining ? 'allowed' : 'disallowed'}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Automated sweeper: {p.compliance.automatedRetentionSweeper ? 'yes' : 'no'} · Certifications product:{' '}
              {p.compliance.certificationsProduct ? 'yes' : 'no'}
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href={(data.links.data) ?? '#'} style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Data settings & residency →
              </Link>
            </p>
          </section>

          <section>
            <h2 style={label}>Billing policy</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {p.billing.planName} · {p.billing.charactersUsed.toLocaleString()} /{' '}
              {p.billing.characterQuota.toLocaleString()} characters
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href={(data.links.billing) ?? '#'} style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Billing →
              </Link>
            </p>
          </section>

          <section>
            <h2 style={label}>Cloud / residency</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Deploy {data.residency.currentDeploy.name} ({data.residency.currentDeploy.code}) · Pin{' '}
              {data.residency.dataRegion ?? 'none'} ·{' '}
              {data.residency.matchesCurrentDeploy ? 'matches' : 'mismatch'}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Availability zones: {p.cloud.availabilityZones ? 'yes' : 'no (islands only)'}
            </p>
          </section>

          <section>
            <h2 style={label}>Workspaces</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.35rem' }}>
              {data.workspaces.map((w) => (
                <li key={w.id} style={{ fontWeight: w.isCurrent ? 600 : 400, color: w.isCurrent ? 'var(--ink)' : 'var(--muted)' }}>
                  {w.name}
                  {w.isCurrent ? ' · current' : ''}
                </li>
              ))}
            </ul>
            <p style={{ margin: '0.65rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {p.governance.members} members · {p.governance.workspaces} workspaces
            </p>
          </section>

          <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href={(data.links.audit) ?? '#'} style={secondaryLink}>
              Audit log
            </Link>
            <Link href={(data.links.workspaces) ?? '#'} style={secondaryLink}>
              Dashboard
            </Link>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const secondaryLink: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--ink)',
};

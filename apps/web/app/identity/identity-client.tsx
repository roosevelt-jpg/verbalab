'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type MemberRow = {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null };
};

type Overview = {
  session: { role: string; userId: string; clerkUserId: string };
  organization: { name: string; clerkOrgId: string | null; plan: string };
  members: { total: number; byRole: Record<string, number>; data: MemberRow[] };
  machineIdentity: { activeKeys: number; revokedKeys: number };
  provider: {
    humanIdp: string;
    saml: string;
    scim: string;
    mfa: string;
    passkeys: string;
  };
  teams: { supported: boolean; useInstead: string };
  rbac: { roles: string[]; abac: boolean };
};

export function IdentityClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const overview = await apiFetch<Overview>('/v1/identity/overview', { token });
    setData(overview);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function setRole(membershipId: string, role: string) {
    setError(null);
    setBusyId(membershipId);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/organization/members/${membershipId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(membershipId: string) {
    if (!window.confirm('Remove this member from the organization?')) return;
    setError(null);
    setBusyId(membershipId);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/organization/members/${membershipId}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setBusyId(null);
    }
  }

  const canManage = data?.session.role === 'owner' || data?.session.role === 'admin';

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
        Identity
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '38rem' }}>
        Human sign-in is Clerk (OIDC/JWT). VerbaLab owns org RBAC, API keys as machine identity, and
        audit. SAML/SCIM/MFA stay with the IdP.
      </p>

      {error ? <p style={{ color: '#b42318', marginBottom: '1rem' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <section>
            <h2
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--muted)',
                margin: '0 0 0.5rem',
              }}
            >
              Organization
            </h2>
            <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{data.organization.name}</p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Your role {data.session.role} · plan {data.organization.plan}
              {data.organization.clerkOrgId ? ' · Clerk org linked' : ' · personal org'}
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--muted)',
                margin: '0 0 0.5rem',
              }}
            >
              Members ({data.members.total})
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Invite in Clerk Organizations. Roles here: owner {data.members.byRole.owner ?? 0} · admin{' '}
              {data.members.byRole.admin ?? 0} · member {data.members.byRole.member ?? 0}.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.65rem' }}>
              {data.members.data.map((m) => {
                const isSelf = m.user.id === data.session.userId;
                return (
                  <li
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {m.user.name ?? m.user.email ?? m.user.id}
                        {isSelf ? ' (you)' : ''}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{m.user.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {canManage && !isSelf ? (
                        <select
                          value={m.role}
                          disabled={busyId === m.id}
                          onChange={(e) => void setRole(m.id, e.target.value)}
                          style={{
                            fontSize: '0.85rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '0.35rem',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {data.rbac.roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{m.role}</span>
                      )}
                      {canManage && !isSelf ? (
                        <button
                          type="button"
                          disabled={busyId === m.id}
                          onClick={() => void removeMember(m.id)}
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '0.35rem',
                            border: '1px solid var(--line)',
                            background: 'transparent',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--muted)',
                margin: '0 0 0.5rem',
              }}
            >
              Machine identity
            </h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {data.machineIdentity.activeKeys} active API key
              {data.machineIdentity.activeKeys === 1 ? '' : 's'}
            </p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {data.machineIdentity.revokedKeys} revoked · workspace-scoped <code>vl_live_</code> secrets
            </p>
            <p style={{ margin: '0.65rem 0 0' }}>
              <Link href="/keys" style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Manage API keys →
              </Link>
            </p>
          </section>

          <section>
            <h2
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--muted)',
                margin: '0 0 0.5rem',
              }}
            >
              Provider map
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              IdP {data.provider.humanIdp} · MFA/passkeys via Clerk · SAML/SCIM: {data.provider.saml} · Teams:{' '}
              {data.teams.supported ? 'yes' : `use ${data.teams.useInstead}`} · ABAC:{' '}
              {data.rbac.abac ? 'yes' : 'no'}
            </p>
            <p style={{ margin: '0.65rem 0 0', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/audit" style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Audit log →
              </Link>
              <Link href="/billing" style={{ color: 'var(--accent)', fontWeight: 550 }}>
                Billing →
              </Link>
            </p>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { CountrySelect } from '@/components/country-select';

type MemberRow = {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null };
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
};

type Overview = {
  session: { role: string; userId: string; clerkUserId: string };
  profile?: { userId: string; email: string | null; name: string | null; residencyCountry: string | null; residencyRegion: string | null; registeredFrom: string | null };
  organization: { name: string; clerkOrgId: string | null; plan: string; residencyCountry?: string | null; residencyRegion?: string | null; registeredFrom?: string | null; dataRegion?: string | null };
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
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [residencyCountry, setResidencyCountry] = useState('');
  const [residencyRegion, setResidencyRegion] = useState('');
  const [orgResidencyCountry, setOrgResidencyCountry] = useState('');
  const [orgResidencyRegion, setOrgResidencyRegion] = useState('');

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const overview = await apiFetch<Overview>('/v1/identity/overview', { token });
    setData(overview);
    setResidencyCountry(overview.profile?.residencyCountry ?? '');
    setResidencyRegion(overview.profile?.residencyRegion ?? '');
    setOrgResidencyCountry(overview.organization.residencyCountry ?? '');
    setOrgResidencyRegion(overview.organization.residencyRegion ?? '');
    try {
      const inviteRows = await apiFetch<InviteRow[]>('/v1/organization/invites', { token });
      setInvites(inviteRows);
      setInviteError(null);
    } catch (err) {
      setInvites([]);
      setInviteError(err instanceof Error ? err.message : 'Could not load invites');
    }
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

  async function sendInvite() {
    setError(null);
    setMessage(null);
    setBusyId('invite');
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/organization/invites', {
        method: 'POST',
        token,
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail('');
      setMessage('Invite sent. They accept by signing in with that email.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setBusyId(null);
    }
  }

  async function revokeInvite(inviteId: string) {
    setError(null);
    setBusyId(inviteId);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/organization/invites/${inviteId}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setBusyId(null);
    }
  }


  async function saveUserResidency() {
    setError(null); setMessage(null); setBusyId('user-residency');
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/residency/user', { method: 'PATCH', token, body: JSON.stringify({ residencyCountry: residencyCountry.trim() || null, residencyRegion: residencyRegion.trim() || null }) });
      setMessage('Your residency saved.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Residency save failed'); }
    finally { setBusyId(null); }
  }
  async function saveOrgResidency() {
    setError(null); setMessage(null); setBusyId('org-residency');
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/residency/organization', { method: 'PATCH', token, body: JSON.stringify({ residencyCountry: orgResidencyCountry.trim() || null, residencyRegion: orgResidencyRegion.trim() || null }) });
      setMessage('Organization residency saved.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Org residency save failed'); }
    finally { setBusyId(null); }
  }
  const canManage = data?.session.role === 'owner' || data?.session.role === 'admin';
  const pendingInvites = invites.filter((i) => i.status === 'pending');

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
        Human sign-in is Clerk (OIDC/JWT). Lugemi owns org RBAC, API keys as machine identity, and
        audit. SAML/SCIM/MFA stay with the IdP.
      </p>

      {error ? <p style={{ color: '#b42318', marginBottom: '1rem' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{message}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {!data && error ? (
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
          Could not load Identity. Confirm you are signed in, then refresh. Billing and API keys stay available under{' '}
          <Link href="/billing" style={{ color: 'var(--accent)' }}>
            Billing
          </Link>{' '}
          and{' '}
          <Link href="/keys" style={{ color: 'var(--accent)' }}>
            API keys
          </Link>
          .
        </p>
      ) : null}

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

          <section>
            <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem' }}>Residency</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>Person residency = registration origin. Models are hosted in Lugemi data centers (<code>GET /v1/residency</code>).</p>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
              <div className="vl-panel" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 650 }}>Your profile</div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Registered from {data.profile?.registeredFrom ?? '—'}</p>
                <CountrySelect value={residencyCountry} onChange={setResidencyCountry} emptyLabel="Residency country" style={{ marginBottom: '0.5rem', width: '100%' }} />
                <input className="vl-field" value={residencyRegion} onChange={(e) => setResidencyRegion(e.target.value)} placeholder="Region label" style={{ marginBottom: '0.75rem', width: '100%' }} />
                <button type="button" className="vl-btn vl-btn-primary" disabled={busyId === 'user-residency'} onClick={() => void saveUserResidency()}>Save my residency</button>
              </div>
              <div className="vl-panel" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 650 }}>Organization</div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Registered from {data.organization.registeredFrom ?? '—'}</p>
                <CountrySelect value={orgResidencyCountry} onChange={setOrgResidencyCountry} disabled={!canManage} emptyLabel="Org residency country" style={{ marginBottom: '0.5rem', width: '100%' }} />
                <input className="vl-field" value={orgResidencyRegion} onChange={(e) => setOrgResidencyRegion(e.target.value)} placeholder="Region label" disabled={!canManage} style={{ marginBottom: '0.75rem', width: '100%' }} />
                {canManage ? <button type="button" className="vl-btn vl-btn-primary" disabled={busyId === 'org-residency'} onClick={() => void saveOrgResidency()}>Save org residency</button> : <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Owners/admins edit org residency.</p>}
              </div>
            </div>
          </section>

              Members ({data.members.total})
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Invite teammates below to share this workspace. Roles: owner {data.members.byRole.owner ?? 0} · admin{' '}
              {data.members.byRole.admin ?? 0} · member {data.members.byRole.member ?? 0}.
            </p>
            {canManage ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendInvite();
                }}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <input
                  className="vl-field"
                  type="email"
                  required
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ minWidth: '14rem', flex: 1 }}
                />
                <select
                  className="vl-field"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  {(data.rbac.roles.includes('owner')
                    ? data.session.role === 'owner'
                      ? data.rbac.roles
                      : data.rbac.roles.filter((r) => r !== 'owner')
                    : ['admin', 'member']
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="vl-btn vl-btn-primary"
                  disabled={busyId === 'invite' || !inviteEmail.trim()}
                >
                  Send invite
                </button>
              </form>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                Only owners and admins can invite or change roles. Ask an owner if you need a teammate added.
              </p>
            )}
            {inviteError ? (
              <p style={{ color: '#b42318', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
                Invites unavailable: {inviteError}
              </p>
            ) : null}
            {pendingInvites.length === 0 ? (
              canManage && !inviteError ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 1rem' }}>
                  No pending invites. Send an email above — they accept by signing in with that address.
                </p>
              ) : null
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'grid', gap: '0.45rem' }}>
                {pendingInvites.map((inv) => (
                  <li
                    key={inv.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      padding: '0.55rem 0',
                      borderTop: '1px solid var(--line)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>
                      <strong>{inv.email}</strong> · {inv.role} · pending
                      {inv.expiresAt ? (
                        <span style={{ color: 'var(--muted)' }}>
                          {' '}
                          · expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </span>
                    {canManage ? (
                      <button
                        type="button"
                        className="vl-btn vl-btn-secondary"
                        disabled={busyId === inv.id}
                        onClick={() => void revokeInvite(inv.id)}
                        style={{ minHeight: 32, fontSize: '0.78rem' }}
                      >
                        Revoke
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {data.members.data.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>No members in this organization yet.</p>
            ) : (
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
            )}
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
              {data.machineIdentity.revokedKeys} revoked · workspace-scoped <code>lg_live_</code> secrets
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

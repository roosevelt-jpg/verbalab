'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type OrgRow = {
  id: string;
  name: string;
  plan: string;
  billingStatus: string;
  characterQuota: number;
  disabledAt: string | null;
  memberCount: number;
  apiKeyCount: number;
};

type OrgDetail = OrgRow & {
  disabledReason: string | null;
  usage: { characters: number; requests: number; periodStart: string };
  apiKeys: Array<{ id: string; name: string; prefix: string; revokedAt: string | null }>;
  members: Array<{
    id: string;
    role: string;
    user: { email: string | null; name: string | null };
  }>;
};

export function AdminClient() {
  const { getToken, isLoaded } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [selected, setSelected] = useState<OrgDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checkStatus = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const status = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token });
    setIsAdmin(status.admin);
  }, [getToken]);

  const search = useCallback(
    async (query: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const data = await apiFetch<OrgRow[]>(
        `/v1/admin/organizations${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`,
        { token },
      );
      setRows(data);
    },
    [getToken],
  );

  useEffect(() => {
    if (!isLoaded) return;
    void checkStatus()
      .then(async () => {
        // status sets isAdmin asynchronously — re-fetch after
      })
      .catch((err: Error) => setError(err.message));
  }, [isLoaded, checkStatus]);

  useEffect(() => {
    if (!isAdmin) return;
    void search('').catch((err: Error) => setError(err.message));
  }, [isAdmin, search]);

  async function openOrg(id: string) {
    setError(null);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const detail = await apiFetch<OrgDetail>(`/v1/admin/organizations/${id}`, { token });
      setSelected(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load org');
    } finally {
      setBusy(false);
    }
  }

  async function revokeKeys(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/admin/organizations/${id}/revoke-keys`, { method: 'POST', token });
      await openOrg(id);
      await search(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setBusy(false);
    }
  }

  async function setDisabled(id: string, disabled: boolean) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/admin/organizations/${id}/disable`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          disabled,
          reason: disabled ? 'Suspended from admin console' : undefined,
        }),
      });
      await openOrg(id);
      await search(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Admin
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Internal org lookup, usage, and key disable — allowlisted via{' '}
        <code className="vl-code">ADMIN_EMAILS</code> / <code className="vl-code">ADMIN_USER_IDS</code>.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {isAdmin === false ? (
        <p style={{ color: 'var(--muted)', marginTop: '1.5rem' }}>
          Your account is not on the platform admin allowlist.
        </p>
      ) : null}

      {isAdmin ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search(q).catch((err: Error) => setError(err.message));
            }}
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <input
              className="vl-input"
              placeholder="Search name, id, Clerk org, Stripe customer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ flex: '1 1 16rem' }}
            />
            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              Search
            </button>
          </form>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="vl-panel"
                  onClick={() => void openOrg(row.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.95rem 1.05rem',
                    cursor: 'pointer',
                    border: selected?.id === row.id ? '1px solid var(--ink)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 650 }}>{row.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {row.plan} · {row.memberCount} members · {row.apiKeyCount} keys
                        {row.disabledAt ? ' · DISABLED' : ''}
                      </div>
                    </div>
                    <div className="vl-code" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {row.id}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <section className="vl-panel" style={{ padding: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{selected.name}</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Usage this period: {selected.usage.characters.toLocaleString()} chars ·{' '}
                {selected.usage.requests} translate requests
                {selected.disabledAt ? ` · Disabled: ${selected.disabledReason ?? 'yes'}` : ''}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="vl-btn"
                  disabled={busy}
                  onClick={() => void revokeKeys(selected.id)}
                >
                  Revoke all keys
                </button>
                {selected.disabledAt ? (
                  <button
                    type="button"
                    className="vl-btn vl-btn-primary"
                    disabled={busy}
                    onClick={() => void setDisabled(selected.id, false)}
                  >
                    Re-enable org
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vl-btn"
                    disabled={busy}
                    onClick={() => void setDisabled(selected.id, true)}
                    style={{ background: 'var(--bad)', color: '#fff', border: 'none' }}
                  >
                    Disable org
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Members</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {selected.members.map((m) => (
                      <li key={m.id}>
                        {m.user.email ?? m.user.name ?? '—'} ({m.role})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>API keys</h3>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {selected.apiKeys.map((k) => (
                      <li key={k.id}>
                        {k.name} · {k.prefix}…{k.revokedAt ? ' (revoked)' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : isAdmin === null && !error ? (
        <p style={{ color: 'var(--muted)' }}>Checking access…</p>
      ) : null}
    </AppShell>
  );
}

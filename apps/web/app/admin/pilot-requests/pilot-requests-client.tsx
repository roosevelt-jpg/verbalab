'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';

type PilotRequest = {
  id: string;
  name: string;
  email: string;
  organization: string;
  orgType: string;
  country: string | null;
  languages: string | null;
  useCase: string;
  message: string | null;
  status: string;
  createdAt: string;
};

const STATUSES = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['pilot', 'In pilot'],
  ['closed', 'Closed'],
] as const;

const ORG_TYPE_LABELS: Record<string, string> = {
  'un-agency': 'UN agency',
  ngo: 'NGO',
  government: 'Government',
  health: 'Health',
  education: 'Education',
  enterprise: 'Company',
  other: 'Other',
};

const USE_CASE_LABELS: Record<string, string> = {
  'listen-live': 'Listen in your language',
  messages: 'One message, every language',
  documents: 'Documents with a human check',
  other: 'Something else',
};

export function PilotRequestsClient() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [filter, setFilter] = useState('');
  const [requests, setRequests] = useState<PilotRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async <T,>(path: string, init: { method?: string; body?: string } = {}) => {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      return apiFetch<T>(path, { ...init, token, workspaceId: null, organizationId: null });
    },
    [getToken],
  );

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/sign-in?redirect_url=%2Fadmin%2Fpilot-requests');
        return;
      }
      try {
        const s = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token });
        setIsAdmin(s.admin);
      } catch (err) {
        setIsAdmin(false);
        setError(err instanceof Error ? err.message : 'Unable to verify admin access');
      }
    })();
  }, [isLoaded, getToken, router]);

  const refresh = useCallback(async () => {
    try {
      const q = filter ? `?status=${encodeURIComponent(filter)}` : '';
      setRequests(await call<PilotRequest[]>(`/v1/admin/pilot-requests${q}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load pilot requests');
    }
  }, [call, filter]);

  useEffect(() => {
    if (isAdmin) void refresh();
  }, [isAdmin, refresh]);

  async function setStatus(id: string, status: string) {
    setBusy(true);
    setError(null);
    try {
      await call(`/v1/admin/pilot-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-admin-console">
        <header className="lg-admin-hero">
          <div>
            <p className="lg-admin-kicker">Organisations</p>
            <h1>Pilot requests</h1>
            <p>Requests from the public Lugemi for organisations page — UN agencies, NGOs, governments, and others.</p>
          </div>
          <div className="lg-admin-hero-links">
            <Link href="/organizations" className="vl-btn">View page</Link>
            <Link href="/admin" className="vl-btn">CMS</Link>
            <Link href="/admin/workspaces" className="vl-btn">Workspaces</Link>
          </div>
        </header>

        {error ? <p className="lg-admin-banner lg-admin-banner--bad">{error}</p> : null}
        {isAdmin === null ? <p style={{ color: 'var(--muted)' }}>Checking access…</p> : null}
        {isAdmin === false ? (
          <section className="vl-panel lg-admin-empty">
            <h2>Platform admin required</h2>
            <p>Sign in with a platform admin account to see pilot requests.</p>
          </section>
        ) : null}

        {isAdmin ? (
          <>
            <div className="lg-admin-filters" style={{ alignItems: 'center' }}>
              <select className="vl-input" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Status">
                <option value="">All statuses</option>
                {STATUSES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span style={{ color: 'var(--muted)' }}>{requests.length} requests</span>
            </div>

            {requests.length === 0 ? (
              <section className="vl-panel lg-admin-empty">
                <p>No pilot requests yet.</p>
              </section>
            ) : (
              <ul className="lg-admin-activity">
                {requests.map((r) => (
                  <li key={r.id} className="vl-panel" style={{ display: 'block', padding: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{r.organization}</strong>{' '}
                        <span style={{ color: 'var(--muted)' }}>
                          {ORG_TYPE_LABELS[r.orgType] ?? r.orgType}
                          {r.country ? ` · ${r.country}` : ''} · {new Date(r.createdAt).toLocaleString()}
                        </span>
                        <div>
                          {r.name} · <a href={`mailto:${r.email}`}>{r.email}</a>
                        </div>
                      </div>
                      <select
                        className="vl-input"
                        value={r.status}
                        disabled={busy}
                        onChange={(e) => void setStatus(r.id, e.target.value)}
                        aria-label={`Status for ${r.organization}`}
                      >
                        {STATUSES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p style={{ margin: '0.6rem 0 0' }}>
                      <strong>Wants:</strong> {USE_CASE_LABELS[r.useCase] ?? r.useCase}
                      {r.languages ? (
                        <>
                          {' '}
                          · <strong>Languages:</strong> {r.languages}
                        </>
                      ) : null}
                    </p>
                    {r.message ? <p style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>{r.message}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

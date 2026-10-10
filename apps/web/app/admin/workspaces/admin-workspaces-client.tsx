'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, setStoredAdminOrgId, setStoredWorkspaceId } from '@/lib/api';
import { CountrySelect } from '@/components/country-select';
import { AppShell } from '@/components/app-shell';
import { LivePulse, Sparkline, StatusRing, UsageMeter } from '@/components/stats/activity-visuals';
import { FEATURE_LABELS, PLAN_FEATURE_KEYS } from '@/data/billing-plans';

function softFailMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const msg = err.message;
  // Never surface raw WebKit/Chromium TypeError: Load failed in the console overlay path.
  if (/load failed|failed to fetch|networkerror|network request failed|cannot reach api/i.test(msg)) {
    return 'Cannot reach the admin API. Check that the API is on :3001 and CORS_ORIGIN includes this origin.';
  }
  if (/not signed in/i.test(msg)) return 'Sign in required.';
  return msg || fallback;
}

type WorkspaceRow = {
  id: string;
  name: string;
  plan: string;
  status: string;
  dataRegion: string | null;
  residencyCountry?: string | null;
  residencyRegion?: string | null;
  registeredFrom?: string | null;
  memberCount: number;
  characterQuota: number;
  disabledAt: string | null;
  createdAt: string;
  usageSummary: { characters: number; requests: number };
};

type ListResponse = {
  items: WorkspaceRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type WorkspaceDetail = {
  id: string;
  name: string;
  plan: string;
  planName: string;
  billingStatus: string;
  characterQuota: number;
  dataRegion: string | null;
  residencyCountry?: string | null;
  residencyRegion?: string | null;
  registeredFrom?: string | null;
  status: string;
  disabledAt: string | null;
  disabledReason: string | null;
  featureOverrides: Record<string, boolean>;
  featureFlags: Record<string, boolean>;
  usage: { characters: number; requests: number };
  quotas: { characterQuota: number; usedCharacters: number; remainingCharacters: number };
  apiKeys: Array<{ id: string; name: string; masked: string; revokedAt: string | null }>;
  members: Array<{ id: string; role: string; user: { email: string | null; name: string | null } }>;
  invites: Array<{ id: string; email: string; role: string; status: string }>;
  modelDefaults: Array<{
    workspaceId: string;
    workspaceName: string;
    defaultSourceLang: string;
    defaultTargetLang: string;
  }>;
  connectors: {
    slack: Array<{ id: string; name: string }>;
    marketplace: Array<{ id: string; name: string; kind: string }>;
  };
  branding: { companyName: string; country: string; region: string } | null;
  activity: Array<{ id: string; action: string; createdAt: string }>;
};

type Analytics = {
  totals: { workspaces: number; active: number; suspended: number; members: number };
  byPlan: Array<{ plan: string; count: number }>;
  byRegion: Array<{ region: string; count: number }>;
  usageByFeature: Array<{ feature: string; units: number; events: number }>;
  sparklineCharacters: number[];
  topWorkspaces: Array<{ id: string; name: string; characters: number; requests: number }>;
};

type AuditRow = {
  id: string;
  action: string;
  route: string | null;
  targetOrganizationId: string | null;
  createdAt: string;
  actor: { email: string | null; name: string | null } | null;
};

type AdminPlan = {
  id: string;
  name: string;
  rank: number;
  characterQuota: number;
  sttMinutesQuota: number;
  ttsCharsQuota: number;
  translateCharsQuota: number;
  chatTokensQuota: number;
  ocrPagesQuota: number;
  workspaceLimit: number;
  priceMonthlyUsd: number | null;
  priceLabel: string;
  blurb?: string;
  features?: string[];
  stripePriceId?: string | null;
  highlight?: boolean;
  active?: boolean;
  isCustom?: boolean;
};

type Tab = 'directory' | 'analytics' | 'audit' | 'create' | 'plans';

const PLANS = ['', 'free', 'pro', 'business', 'enterprise'];
const STATUSES = ['', 'active', 'suspended'];
const REGIONS = ['', 'us', 'eu', 'af', 'unset'];
const FLAG_KEYS = [
  'commercial',
  'marketplace',
  'voiceClones',
  'fineTunes',
  'prioritySupport',
  'sso',
  'dedicated',
  'workspacesExtra',
] as const;

export function AdminWorkspacesClient() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [tab, setTab] = useState<Tab>('directory');
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ListResponse | null>(null);
  const [selected, setSelected] = useState<WorkspaceDetail | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    plan: 'free',
    ownerEmail: '',
    dataRegion: '',
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [editPlan, setEditPlan] = useState('free');
  const [editQuota, setEditQuota] = useState(50000);
  const [editRegion, setEditRegion] = useState('');
  const [editResidencyCountry, setEditResidencyCountry] = useState('');
  const [editResidencyRegion, setEditResidencyRegion] = useState('');
  const [editRegisteredFrom, setEditRegisteredFrom] = useState('');
  const [plansList, setPlansList] = useState<AdminPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [newPlanForm, setNewPlanForm] = useState({
    id: '',
    name: '',
    rank: 1,
    characterQuota: 2000000,
    sttMinutesQuota: 300,
    ttsCharsQuota: 2000000,
    translateCharsQuota: 2000000,
    chatTokensQuota: 1000000,
    ocrPagesQuota: 500,
    workspaceLimit: 1,
    priceMonthlyUsd: 99 as number | null,
    priceLabel: '$99',
    blurb: '',
    features: ['speech', 'translate', 'playground'] as string[],
    stripePriceId: '',
    active: true,
  });

  const tokenFn = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    return token;
  }, [getToken]);

  const loadList = useCallback(async () => {
    const token = await tokenFn();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (plan) params.set('plan', plan);
    if (status) params.set('status', status);
    if (region) params.set('region', region);
    params.set('page', String(page));
    params.set('pageSize', '25');
    setList(await apiFetch<ListResponse>(`/v1/admin/workspaces?${params}`, { token }));
  }, [tokenFn, q, plan, status, region, page]);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setSignedOut(true);
          setIsAdmin(false);
          const redirect = encodeURIComponent('/admin/workspaces');
          router.replace(`/sign-in?redirect_url=${redirect}`);
          return;
        }
        setSignedOut(false);
        const s = await apiFetch<{ admin: boolean }>('/v1/admin/status', { token });
        setIsAdmin(s.admin);
      } catch (err) {
        // Auth/network soft-fail: do not throw into Next error overlay.
        setIsAdmin(false);
        setError(softFailMessage(err, 'Unable to verify platform admin status'));
      }
    })();
  }, [isLoaded, getToken, router]);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'directory') void loadList().catch((e) => setError(softFailMessage(e, 'Load failed')));
    if (tab === 'analytics') {
      void tokenFn()
        .then((token) => apiFetch<Analytics>('/v1/admin/workspaces/analytics', { token }))
        .then(setAnalytics)
        .catch((e) => setError(softFailMessage(e, 'Analytics failed')));
    }
    if (tab === 'audit') {
      void tokenFn()
        .then((token) => apiFetch<AuditRow[]>('/v1/admin/workspaces/audit?limit=80', { token }))
        .then(setAuditRows)
        .catch((e) => setError(softFailMessage(e, 'Audit load failed')));
    }
    if (tab === 'plans') {
      void tokenFn()
        .then((token) => apiFetch<AdminPlan[]>('/v1/admin/plans', { token }))
        .then(setPlansList)
        .catch((e) => setError(softFailMessage(e, 'Plans load failed')));
    }
  }, [isAdmin, tab, loadList, tokenFn]);

  async function openDetail(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenFn();
      const detail = await apiFetch<WorkspaceDetail>(`/v1/admin/workspaces/${id}`, { token });
      setSelected(detail);
      setEditPlan(detail.plan);
      setEditQuota(detail.characterQuota);
      setEditRegion(detail.dataRegion ?? '');
      setEditResidencyCountry(detail.residencyCountry ?? '');
      setEditResidencyRegion(detail.residencyRegion ?? '');
      setEditRegisteredFrom(detail.registeredFrom ?? '');
    } catch (err) {
      setError(softFailMessage(err, 'Load failed'));
    } finally {
      setBusy(false);
    }
  }

  async function suspendOrResume(id: string, suspend: boolean) {
    setBusy(true);
    try {
      const token = await tokenFn();
      await apiFetch(`/v1/admin/workspaces/${id}/${suspend ? 'suspend' : 'resume'}`, {
        method: 'POST',
        token,
        body: JSON.stringify(suspend ? { reason: 'Suspended from platform admin console' } : {}),
      });
      await openDetail(id);
      await loadList();
      setMessage(suspend ? 'Workspace suspended' : 'Workspace resumed');
    } catch (err) {
      setError(softFailMessage(err, 'Update failed'));
    } finally {
      setBusy(false);
    }
  }

  async function openAs(id: string) {
    setBusy(true);
    try {
      const token = await tokenFn();
      const res = await apiFetch<{ organizationId: string; workspaceId: string | null }>(
        `/v1/admin/workspaces/${id}/open-as`,
        { method: 'POST', token },
      );
      setStoredAdminOrgId(res.organizationId);
      if (res.workspaceId) setStoredWorkspaceId(res.workspaceId);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(softFailMessage(err, 'Open-as failed'));
      setBusy(false);
    }
  }

  async function runBulk(action: 'suspend' | 'resume' | 'export') {
    const ids = [...selectedIds];
    if (!ids.length) {
      setError('Select at least one workspace');
      return;
    }
    setBusy(true);
    try {
      const token = await tokenFn();
      const res = await apiFetch<{ csv?: string; count?: number }>('/v1/admin/workspaces/bulk', {
        method: 'POST',
        token,
        body: JSON.stringify({ action, organizationIds: ids }),
      });
      if (action === 'export' && res.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lugemi-workspaces-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage(`Exported ${res.count ?? ids.length} workspaces`);
      } else {
        setMessage(`Bulk ${action} finished`);
        setSelectedIds(new Set());
        await loadList();
      }
    } catch (err) {
      setError(softFailMessage(err, 'Bulk failed'));
    } finally {
      setBusy(false);
    }
  }

  const allSelected = useMemo(
    () => Boolean(list?.items.length && list.items.every((r) => selectedIds.has(r.id))),
    [list, selectedIds],
  );

  return (
    <AppShell>
      <div className="lg-admin-console">
        <header className="lg-admin-hero">
          <div>
            <p className="lg-admin-kicker">
              <LivePulse label="Platform" /> Platform ops
            </p>
            <h1>Workspace admin</h1>
            <p>
              Manage every Lugemi customer workspace — search, suspend, entitlements, usage, and
              audit.
            </p>
          </div>
          <div className="lg-admin-hero-links">
            <Link href="/admin" className="vl-btn">
              CMS
            </Link>
            <Link href="/admin/voice-data" className="vl-btn">
              Voice data
            </Link>
          </div>
        </header>

        {error ? <p className="lg-admin-banner lg-admin-banner--bad">{error}</p> : null}
        {message ? <p className="lg-admin-banner lg-admin-banner--ok">{message}</p> : null}

        {signedOut ? (
          <section className="vl-panel lg-admin-empty">
            <h2>Sign in required</h2>
            <p>
              Redirecting to sign-in…{' '}
              <Link href="/sign-in?redirect_url=%2Fadmin%2Fworkspaces">Continue to sign-in</Link>
              {' · '}
              <Link href="/dev-login">/dev-login</Link>
            </p>
          </section>
        ) : null}

        {isAdmin === false && !signedOut ? (
          <section className="vl-panel lg-admin-empty">
            <h2>Platform admin required</h2>
            <p>
              Add your email to <code className="vl-code">ADMIN_EMAILS</code> or{' '}
              <code className="vl-code">LUGEMI_PLATFORM_ADMIN_EMAILS</code>, then sign in again.
              Local shortcut: <Link href="/dev-login">/dev-login</Link>.
            </p>
          </section>
        ) : null}

        {isAdmin === null && !signedOut ? <p style={{ color: 'var(--muted)' }}>Checking access…</p> : null}

        {isAdmin ? (
          <>
            <nav className="lg-admin-tabs" aria-label="Admin sections">
              {(
                [
                  ['directory', 'Directory'],
                  ['plans', 'Plan catalog'],
                  ['analytics', 'Usage analytics'],
                  ['audit', 'Audit log'],
                  ['create', 'Create workspace'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? 'lg-admin-tab lg-admin-tab--active' : 'lg-admin-tab'}
                  onClick={() => {
                    setTab(id);
                    setError(null);
                    setMessage(null);
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === 'directory' ? (
              <div className="lg-admin-grid">
                <section className="lg-admin-list-pane">
                  <form
                    className="lg-admin-filters"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPage(1);
                      void loadList().catch((err: Error) => setError(err.message));
                    }}
                  >
                    <input
                      className="vl-input"
                      placeholder="Search name, id, Clerk org, Stripe…"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                    <select className="vl-input" value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} aria-label="Plan">
                      {PLANS.map((p) => (
                        <option key={p || 'all'} value={p}>{p || 'All plans'}</option>
                      ))}
                    </select>
                    <select className="vl-input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
                      {STATUSES.map((s) => (
                        <option key={s || 'all'} value={s}>{s || 'All statuses'}</option>
                      ))}
                    </select>
                    <select className="vl-input" value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }} aria-label="Region">
                      {REGIONS.map((r) => (
                        <option key={r || 'all'} value={r}>{r || 'All regions'}</option>
                      ))}
                    </select>
                    <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>Search</button>
                  </form>

                  <div className="lg-admin-bulk">
                    <label>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => {
                          if (!list) return;
                          setSelectedIds(allSelected ? new Set() : new Set(list.items.map((r) => r.id)));
                        }}
                      />{' '}
                      Select page
                    </label>
                    <button type="button" className="vl-btn" disabled={busy || !selectedIds.size} onClick={() => void runBulk('suspend')}>Suspend</button>
                    <button type="button" className="vl-btn" disabled={busy || !selectedIds.size} onClick={() => void runBulk('resume')}>Resume</button>
                    <button type="button" className="vl-btn" disabled={busy || !selectedIds.size} onClick={() => void runBulk('export')}>Export CSV</button>
                  </div>

                  {!list ? (
                    <p style={{ color: 'var(--muted)' }}>Loading workspaces…</p>
                  ) : list.items.length === 0 ? (
                    <div className="lg-admin-empty"><h3>No workspaces match</h3><p>Try clearing filters or create a workspace.</p></div>
                  ) : (
                    <ul className="lg-admin-rows">
                      {list.items.map((row) => (
                        <li key={row.id}>
                          <div className={selected?.id === row.id ? 'lg-admin-row lg-admin-row--active' : 'lg-admin-row'}>
                            <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.id)) next.delete(row.id); else next.add(row.id);
                                return next;
                              });
                            }} aria-label={`Select ${row.name}`} />
                            <button type="button" onClick={() => void openDetail(row.id)}>
                              <strong>{row.name}</strong>
                              <span>{row.plan} · {row.status} · {row.memberCount} members · {(row.usageSummary.characters / 1000).toFixed(1)}k chars{row.dataRegion ? ` · pin ${row.dataRegion}` : ''}{row.residencyCountry ? ` · residency ${row.residencyCountry}` : ''}</span>
                              <code>{row.id}</code>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {list && list.totalPages > 1 ? (
                    <div className="lg-admin-pager">
                      <button type="button" className="vl-btn" disabled={page <= 1 || busy} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                      <span>Page {list.page} / {list.totalPages} · {list.total} total</span>
                      <button type="button" className="vl-btn" disabled={page >= list.totalPages || busy} onClick={() => setPage((p) => p + 1)}>Next</button>
                    </div>
                  ) : null}
                </section>

                <section className="lg-admin-detail-pane">
                  {!selected ? (
                    <div className="lg-admin-empty"><h3>Select a workspace</h3><p>Members, keys, connectors, quotas, and audit appear here.</p></div>
                  ) : (
                    <div className="lg-admin-detail">
                      <div className="lg-admin-detail-head">
                        <div>
                          <h2>{selected.name}</h2>
                          <p>{selected.planName} · {selected.status}{selected.disabledReason ? ` · ${selected.disabledReason}` : ''}</p>
                        </div>
                        <StatusRing status={selected.disabledAt ? 'bad' : 'ok'} label={selected.disabledAt ? 'Suspended' : 'Active'} detail={selected.billingStatus} />
                      </div>
                      <div className="lg-admin-actions">
                        <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void openAs(selected.id)}>Open as workspace</button>
                        <button type="button" className="vl-btn" disabled={busy} onClick={() => void (async () => {
                          const token = await tokenFn();
                          await apiFetch(`/v1/admin/workspaces/${selected.id}/revoke-keys`, { method: 'POST', token });
                          await openDetail(selected.id);
                          setMessage('API keys revoked');
                        })()}>Revoke all keys</button>
                        {selected.disabledAt ? (
                          <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void suspendOrResume(selected.id, false)}>Resume</button>
                        ) : (
                          <button type="button" className="vl-btn" disabled={busy} onClick={() => void suspendOrResume(selected.id, true)} style={{ background: 'var(--bad)', color: '#fff', border: 'none' }}>Suspend</button>
                        )}
                      </div>
                      <UsageMeter
                        label="Character quota (period)"
                        value={selected.quotas?.usedCharacters ?? selected.usage?.characters ?? 0}
                        max={selected.quotas?.characterQuota ?? selected.characterQuota ?? 0}
                        unit="chars"
                      />

                      <div className="lg-admin-section">
                        <h3>Billing & region</h3>
                        <div className="lg-admin-inline-form">
                          <select className="vl-input" value={editPlan} onChange={(e) => setEditPlan(e.target.value)}>
                            {PLANS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <input className="vl-input" type="number" value={editQuota} onChange={(e) => setEditQuota(Number(e.target.value))} aria-label="Quota" />
                          <input className="vl-input" value={editRegion} onChange={(e) => setEditRegion(e.target.value)} placeholder="Deploy pin (us/eu)" aria-label="Deploy region" />
                          <CountrySelect className="vl-input" value={editResidencyCountry} onChange={setEditResidencyCountry} emptyLabel="Residency country" aria-label="Residency country" />
                          <input className="vl-input" value={editResidencyRegion} onChange={(e) => setEditResidencyRegion(e.target.value)} placeholder="Residency region" aria-label="Residency region" />
                          <CountrySelect className="vl-input" value={editRegisteredFrom} onChange={setEditRegisteredFrom} emptyLabel="Registered from" aria-label="Registered from" />
                          <button type="button" className="vl-btn" disabled={busy} onClick={() => void (async () => {
                            const token = await tokenFn();
                            await apiFetch(`/v1/admin/workspaces/${selected.id}`, { method: 'PATCH', token, body: JSON.stringify({ plan: editPlan, characterQuota: editQuota, dataRegion: editRegion || null, residencyCountry: editResidencyCountry || null, residencyRegion: editResidencyRegion || null, registeredFrom: editRegisteredFrom || null }) });
                            await openDetail(selected.id); await loadList(); setMessage('Billing & residency updated');
                          })()}>Save</button>
                        </div>
                      </div>

                      <div className="lg-admin-section">
                        <h3>Feature entitlements</h3>
                        <div className="lg-admin-flags">
                          {FLAG_KEYS.map((key) => {
                            const overridden = key in selected.featureOverrides;
                            const value = overridden ? selected.featureOverrides[key] : Boolean(selected.featureFlags[key]);
                            return (
                              <label key={key} className="lg-admin-flag">
                                <input type="checkbox" checked={Boolean(value)} disabled={busy} onChange={(e) => void (async () => {
                                  const token = await tokenFn();
                                  await apiFetch(`/v1/admin/workspaces/${selected.id}`, { method: 'PATCH', token, body: JSON.stringify({ featureOverrides: { [key]: e.target.checked } }) });
                                  await openDetail(selected.id); setMessage('Entitlements updated');
                                })()} />
                                <span>{key}{overridden ? ' (override)' : ''}</span>
                                {overridden ? (
                                  <button type="button" className="vl-btn" disabled={busy} onClick={() => void (async () => {
                                    const token = await tokenFn();
                                    await apiFetch(`/v1/admin/workspaces/${selected.id}`, { method: 'PATCH', token, body: JSON.stringify({ featureOverrides: { [key]: null } }) });
                                    await openDetail(selected.id);
                                  })()}>Clear</button>
                                ) : null}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="lg-admin-columns">
                        <div>
                          <h3>Members</h3>
                          <ul>{selected.members.map((m) => <li key={m.id}>{m.user.email ?? m.user.name ?? '—'} ({m.role})</li>)}</ul>
                          <div className="lg-admin-inline-form">
                            <input className="vl-input" placeholder="Invite email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                            <select className="vl-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                              <option value="member">member</option>
                              <option value="admin">admin</option>
                              <option value="owner">owner</option>
                            </select>
                            <button type="button" className="vl-btn" disabled={busy} onClick={() => void (async () => {
                              const token = await tokenFn();
                              await apiFetch(`/v1/admin/workspaces/${selected.id}/invites`, { method: 'POST', token, body: JSON.stringify({ email: inviteEmail, role: inviteRole }) });
                              setInviteEmail(''); await openDetail(selected.id); setMessage('Invite created');
                            })()}>Invite</button>
                          </div>
                          {selected.invites.filter((i) => i.status === 'pending').length ? (
                            <ul>{selected.invites.filter((i) => i.status === 'pending').map((i) => <li key={i.id}>{i.email} · {i.role}</li>)}</ul>
                          ) : null}
                        </div>
                        <div>
                          <h3>API keys</h3>
                          <ul>{selected.apiKeys.length ? selected.apiKeys.map((k) => <li key={k.id}>{k.name} · {k.masked}{k.revokedAt ? ' (revoked)' : ''}</li>) : <li style={{ color: 'var(--muted)' }}>No keys</li>}</ul>
                          <h3>Model defaults</h3>
                          <ul>{selected.modelDefaults.map((m) => <li key={m.workspaceId}>{m.workspaceName}: {m.defaultSourceLang} → {m.defaultTargetLang}</li>)}</ul>
                        </div>
                      </div>

                      <div className="lg-admin-section">
                        <h3>Connectors</h3>
                        <ul>
                          {(selected.connectors?.slack ?? []).map((c) => <li key={c.id}>Slack · {c.name}</li>)}
                          {(selected.connectors?.marketplace ?? []).map((c) => <li key={c.id}>{c.kind} · {c.name}</li>)}
                          {!(selected.connectors?.slack?.length) && !(selected.connectors?.marketplace?.length) ? <li style={{ color: 'var(--muted)' }}>None installed</li> : null}
                        </ul>
                      </div>

                      {selected.branding ? (
                        <div className="lg-admin-section">
                          <h3>Platform branding snapshot</h3>
                          <p style={{ color: 'var(--muted)', margin: 0 }}>{selected.branding.companyName}{selected.branding.country ? ` · ${selected.branding.country}` : ''}{selected.branding.region ? ` · ${selected.branding.region}` : ''}</p>
                        </div>
                      ) : null}

                      <div className="lg-admin-section">
                        <h3>Recent activity</h3>
                        <ul className="lg-admin-activity">
                          {selected.activity.length ? selected.activity.slice(0, 12).map((ev) => (
                            <li key={ev.id}><strong>{ev.action}</strong><span>{new Date(ev.createdAt).toLocaleString()}</span></li>
                          )) : <li style={{ color: 'var(--muted)' }}>No events</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {tab === 'plans' ? (
              <section className="vl-panel" style={{ padding: '1.25rem', display: 'grid', gap: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--brand-navy)' }}>
                    Plan catalog — prices, products & features
                  </h2>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 0', maxWidth: '42rem', lineHeight: 1.5 }}>
                    You control what every subscriber sees and can use. Product quotas, feature entitlements, and pricing
                    here apply live to Pricing, Billing, checkout, and API gates for orgs on that plan. Assign a plan to
                    any workspace from the Directory tab.
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))' }}>
                  {plansList.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'grid',
                        gap: '0.5rem',
                        background: 'var(--card-bg, #fff)',
                        opacity: p.active === false ? 0.65 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.name}</span>
                        <span className="vl-code" style={{ fontSize: '0.8rem' }}>{p.id}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
                        {p.priceLabel}
                        {p.priceMonthlyUsd != null ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}> / mo</span>
                        ) : null}
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{p.blurb || 'No blurb yet.'}</p>
                      <div style={{ fontSize: '0.85rem', display: 'grid', gap: '0.25rem', marginTop: '0.5rem' }}>
                        <div><strong>TTS:</strong> {(p.ttsCharsQuota ?? 0).toLocaleString()} chars</div>
                        <div><strong>STT:</strong> {(p.sttMinutesQuota ?? 0).toLocaleString()} min</div>
                        <div><strong>Translate:</strong> {(p.translateCharsQuota ?? 0).toLocaleString()} chars</div>
                        <div><strong>Chat:</strong> {(p.chatTokensQuota ?? 0).toLocaleString()} tokens</div>
                        <div><strong>OCR:</strong> {(p.ocrPagesQuota ?? 0).toLocaleString()} pages</div>
                        <div><strong>Workspaces:</strong> {p.workspaceLimit < 0 ? 'Unlimited' : p.workspaceLimit}</div>
                      </div>
                      <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {(p.features ?? []).length ? (
                          (p.features ?? []).map((f) => <li key={f}>{FEATURE_LABELS[f] ?? f}</li>)
                        ) : (
                          <li>No features selected</li>
                        )}
                      </ul>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                        {p.highlight ? <span className="vl-tag">Popular</span> : null}
                        {p.active === false ? <span className="vl-tag">Hidden</span> : null}
                        {p.isCustom ? <span className="vl-tag">Custom</span> : null}
                      </div>
                      <button
                        type="button"
                        className="vl-btn"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() =>
                          setEditingPlan({
                            ...p,
                            features: [...(p.features ?? [])],
                            blurb: p.blurb ?? '',
                          })
                        }
                      >
                        Edit plan
                      </button>
                    </div>
                  ))}
                </div>

                {editingPlan ? (
                  <div style={{ borderTop: '2px solid var(--line)', paddingTop: '1.25rem', display: 'grid', gap: '0.85rem' }}>
                    <h3 style={{ margin: 0 }}>Edit plan: {editingPlan.name} ({editingPlan.id})</h3>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
                      Changes publish immediately to Pricing/Billing and unlock or lock features for every org on this plan.
                    </p>
                    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
                      <label>
                        Name
                        <input className="vl-input" value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} />
                      </label>
                      <label>
                        Rank
                        <input className="vl-input" type="number" value={editingPlan.rank} onChange={(e) => setEditingPlan({ ...editingPlan, rank: Number(e.target.value) })} />
                      </label>
                      <label>
                        Price label
                        <input className="vl-input" value={editingPlan.priceLabel} onChange={(e) => setEditingPlan({ ...editingPlan, priceLabel: e.target.value })} />
                      </label>
                      <label>
                        Monthly USD
                        <input
                          className="vl-input"
                          type="number"
                          value={editingPlan.priceMonthlyUsd ?? ''}
                          placeholder="Custom / null"
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              priceMonthlyUsd: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Stripe price ID
                        <input
                          className="vl-input"
                          value={editingPlan.stripePriceId ?? ''}
                          placeholder="price_…"
                          onChange={(e) => setEditingPlan({ ...editingPlan, stripePriceId: e.target.value || null })}
                        />
                      </label>
                      <label>
                        Workspace limit (−1 = unlimited)
                        <input className="vl-input" type="number" value={editingPlan.workspaceLimit} onChange={(e) => setEditingPlan({ ...editingPlan, workspaceLimit: Number(e.target.value) })} />
                      </label>
                      <label>
                        Combined character quota
                        <input className="vl-input" type="number" value={editingPlan.characterQuota} onChange={(e) => setEditingPlan({ ...editingPlan, characterQuota: Number(e.target.value) })} />
                      </label>
                      <label>
                        TTS chars
                        <input className="vl-input" type="number" value={editingPlan.ttsCharsQuota ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, ttsCharsQuota: Number(e.target.value) })} />
                      </label>
                      <label>
                        STT minutes
                        <input className="vl-input" type="number" value={editingPlan.sttMinutesQuota ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, sttMinutesQuota: Number(e.target.value) })} />
                      </label>
                      <label>
                        Translate chars
                        <input className="vl-input" type="number" value={editingPlan.translateCharsQuota ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, translateCharsQuota: Number(e.target.value) })} />
                      </label>
                      <label>
                        Chat tokens
                        <input className="vl-input" type="number" value={editingPlan.chatTokensQuota ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, chatTokensQuota: Number(e.target.value) })} />
                      </label>
                      <label>
                        OCR pages
                        <input className="vl-input" type="number" value={editingPlan.ocrPagesQuota ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, ocrPagesQuota: Number(e.target.value) })} />
                      </label>
                    </div>
                    <label>
                      Blurb (shown on Pricing & Billing)
                      <textarea
                        className="vl-input"
                        rows={2}
                        value={editingPlan.blurb ?? ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, blurb: e.target.value })}
                      />
                    </label>
                    <fieldset style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '0.75rem 1rem', margin: 0 }}>
                      <legend style={{ fontWeight: 600, padding: '0 0.35rem' }}>Features & products on this plan</legend>
                      <p style={{ margin: '0 0 0.65rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Checked items are unlocked for every user on this plan. Unchecked items stay gated until you add them here or assign a higher plan.
                      </p>
                      <div style={{ display: 'grid', gap: '0.4rem', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' }}>
                        {PLAN_FEATURE_KEYS.map((key) => {
                          const on = (editingPlan.features ?? []).includes(key);
                          return (
                            <label key={key} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.88rem' }}>
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={(e) => {
                                  const next = new Set(editingPlan.features ?? []);
                                  if (e.target.checked) next.add(key);
                                  else next.delete(key);
                                  setEditingPlan({ ...editingPlan, features: [...next] });
                                }}
                              />
                              {FEATURE_LABELS[key] ?? key}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                    <label style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editingPlan.highlight)}
                        onChange={(e) => setEditingPlan({ ...editingPlan, highlight: e.target.checked })}
                      />
                      Highlight as Popular on Pricing
                    </label>
                    <label style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={editingPlan.active !== false}
                        onChange={(e) => setEditingPlan({ ...editingPlan, active: e.target.checked })}
                      />
                      Active on public Pricing catalog
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="vl-btn vl-btn-primary"
                        disabled={busy}
                        onClick={() => void (async () => {
                          setBusy(true);
                          try {
                            const token = await tokenFn();
                            await apiFetch(`/v1/admin/plans/${editingPlan.id}`, {
                              method: 'PATCH',
                              token,
                              body: JSON.stringify({
                                name: editingPlan.name,
                                rank: editingPlan.rank,
                                characterQuota: editingPlan.characterQuota,
                                sttMinutesQuota: editingPlan.sttMinutesQuota,
                                ttsCharsQuota: editingPlan.ttsCharsQuota,
                                translateCharsQuota: editingPlan.translateCharsQuota,
                                chatTokensQuota: editingPlan.chatTokensQuota,
                                ocrPagesQuota: editingPlan.ocrPagesQuota,
                                workspaceLimit: editingPlan.workspaceLimit,
                                priceMonthlyUsd: editingPlan.priceMonthlyUsd,
                                priceLabel: editingPlan.priceLabel,
                                blurb: editingPlan.blurb ?? '',
                                features: editingPlan.features ?? [],
                                stripePriceId: editingPlan.stripePriceId ?? null,
                                highlight: Boolean(editingPlan.highlight),
                                active: editingPlan.active !== false,
                              }),
                            });
                            setMessage(`Updated plan ${editingPlan.id} — live for all orgs on this plan`);
                            setEditingPlan(null);
                            const updated = await apiFetch<AdminPlan[]>('/v1/admin/plans', { token });
                            setPlansList(updated);
                          } catch (err) {
                            setError(softFailMessage(err, 'Plan update failed'));
                          } finally {
                            setBusy(false);
                          }
                        })()}
                      >
                        Save plan
                      </button>
                      <button type="button" className="vl-btn" onClick={() => setEditingPlan(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div style={{ borderTop: '2px solid var(--line)', paddingTop: '1.25rem', display: 'grid', gap: '0.85rem' }}>
                  <h3 style={{ margin: 0 }}>Create new plan</h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Custom tiers (partner, pilot, regional) appear in Pricing once active. Assign them from Directory → plan.
                  </p>
                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
                    <label>
                      Plan slug (ID)
                      <input className="vl-input" placeholder="e.g. enterprise-plus" value={newPlanForm.id} onChange={(e) => setNewPlanForm({ ...newPlanForm, id: e.target.value })} />
                    </label>
                    <label>
                      Name
                      <input className="vl-input" placeholder="e.g. Enterprise Plus" value={newPlanForm.name} onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })} />
                    </label>
                    <label>
                      Rank
                      <input className="vl-input" type="number" value={newPlanForm.rank} onChange={(e) => setNewPlanForm({ ...newPlanForm, rank: Number(e.target.value) })} />
                    </label>
                    <label>
                      Price label
                      <input className="vl-input" placeholder="$499" value={newPlanForm.priceLabel} onChange={(e) => setNewPlanForm({ ...newPlanForm, priceLabel: e.target.value })} />
                    </label>
                    <label>
                      Monthly USD
                      <input className="vl-input" type="number" value={newPlanForm.priceMonthlyUsd ?? ''} onChange={(e) => setNewPlanForm({ ...newPlanForm, priceMonthlyUsd: e.target.value === '' ? null : Number(e.target.value) })} />
                    </label>
                    <label>
                      Workspace limit (−1 = unlimited)
                      <input className="vl-input" type="number" value={newPlanForm.workspaceLimit} onChange={(e) => setNewPlanForm({ ...newPlanForm, workspaceLimit: Number(e.target.value) })} />
                    </label>
                    <label>
                      TTS chars
                      <input className="vl-input" type="number" value={newPlanForm.ttsCharsQuota} onChange={(e) => setNewPlanForm({ ...newPlanForm, ttsCharsQuota: Number(e.target.value) })} />
                    </label>
                    <label>
                      STT minutes
                      <input className="vl-input" type="number" value={newPlanForm.sttMinutesQuota} onChange={(e) => setNewPlanForm({ ...newPlanForm, sttMinutesQuota: Number(e.target.value) })} />
                    </label>
                    <label>
                      Translate chars
                      <input className="vl-input" type="number" value={newPlanForm.translateCharsQuota} onChange={(e) => setNewPlanForm({ ...newPlanForm, translateCharsQuota: Number(e.target.value) })} />
                    </label>
                    <label>
                      Chat tokens
                      <input className="vl-input" type="number" value={newPlanForm.chatTokensQuota} onChange={(e) => setNewPlanForm({ ...newPlanForm, chatTokensQuota: Number(e.target.value) })} />
                    </label>
                    <label>
                      OCR pages
                      <input className="vl-input" type="number" value={newPlanForm.ocrPagesQuota} onChange={(e) => setNewPlanForm({ ...newPlanForm, ocrPagesQuota: Number(e.target.value) })} />
                    </label>
                    <label>
                      Combined character quota
                      <input className="vl-input" type="number" value={newPlanForm.characterQuota} onChange={(e) => setNewPlanForm({ ...newPlanForm, characterQuota: Number(e.target.value) })} />
                    </label>
                  </div>
                  <label>
                    Blurb
                    <textarea className="vl-input" rows={2} value={newPlanForm.blurb} onChange={(e) => setNewPlanForm({ ...newPlanForm, blurb: e.target.value })} />
                  </label>
                  <fieldset style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '0.75rem 1rem', margin: 0 }}>
                    <legend style={{ fontWeight: 600, padding: '0 0.35rem' }}>Features on this plan</legend>
                    <div style={{ display: 'grid', gap: '0.4rem', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))' }}>
                      {PLAN_FEATURE_KEYS.map((key) => {
                        const on = newPlanForm.features.includes(key);
                        return (
                          <label key={key} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.88rem' }}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={(e) => {
                                const next = new Set(newPlanForm.features);
                                if (e.target.checked) next.add(key);
                                else next.delete(key);
                                setNewPlanForm({ ...newPlanForm, features: [...next] });
                              }}
                            />
                            {FEATURE_LABELS[key] ?? key}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                  <button
                    type="button"
                    className="vl-btn vl-btn-primary"
                    disabled={busy || !newPlanForm.id.trim() || !newPlanForm.name.trim()}
                    onClick={() => void (async () => {
                      setBusy(true);
                      try {
                        const token = await tokenFn();
                        await apiFetch('/v1/admin/plans', {
                          method: 'POST',
                          token,
                          body: JSON.stringify({
                            ...newPlanForm,
                            stripePriceId: newPlanForm.stripePriceId || undefined,
                          }),
                        });
                        setMessage(`Created plan ${newPlanForm.id}`);
                        setNewPlanForm({
                          id: '',
                          name: '',
                          rank: 1,
                          characterQuota: 2000000,
                          sttMinutesQuota: 300,
                          ttsCharsQuota: 2000000,
                          translateCharsQuota: 2000000,
                          chatTokensQuota: 1000000,
                          ocrPagesQuota: 500,
                          workspaceLimit: 1,
                          priceMonthlyUsd: 99,
                          priceLabel: '$99',
                          blurb: '',
                          features: ['speech', 'translate', 'playground'],
                          stripePriceId: '',
                          active: true,
                        });
                        const updated = await apiFetch<AdminPlan[]>('/v1/admin/plans', { token });
                        setPlansList(updated);
                      } catch (err) {
                        setError(softFailMessage(err, 'Create plan failed'));
                      } finally {
                        setBusy(false);
                      }
                    })()}
                  >
                    Create plan
                  </button>
                </div>
              </section>
            ) : null}

            {tab === 'analytics' ? (
              !analytics ? <p style={{ color: 'var(--muted)' }}>Loading analytics…</p> : (
                <section className="lg-admin-analytics">
                  <div className="lg-admin-stat-row">
                    {([
                      ['Workspaces', analytics.totals.workspaces],
                      ['Active', analytics.totals.active],
                      ['Suspended', analytics.totals.suspended],
                      ['Members', analytics.totals.members],
                    ] as const).map(([label, value]) => (
                      <div key={label} className="vl-panel lg-admin-stat">
                        <div className="lg-stat-label">{label}</div>
                        <div className="lg-admin-stat-value">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="vl-panel" style={{ padding: '1.1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Translate characters (14d)</h2>
                      <Sparkline series={analytics.sparklineCharacters ?? []} title="Characters" />
                    </div>
                  </div>
                  <div className="lg-admin-columns" style={{ marginTop: '1rem' }}>
                    <div className="vl-panel" style={{ padding: '1rem' }}>
                      <h3>By plan</h3>
                      <ul>{analytics.byPlan.map((p) => <li key={p.plan}>{p.plan}: {p.count}</li>)}</ul>
                      <h3>By region</h3>
                      <ul>{analytics.byRegion.map((r) => <li key={r.region}>{r.region}: {r.count}</li>)}</ul>
                    </div>
                    <div className="vl-panel" style={{ padding: '1rem' }}>
                      <h3>Top workspaces</h3>
                      <ul>
                        {analytics.topWorkspaces.map((w) => (
                          <li key={w.id}>
                            <button type="button" className="lg-admin-linkish" onClick={() => { setTab('directory'); void openDetail(w.id); }}>{w.name}</button>
                            {' '}· {w.characters.toLocaleString()} chars · {w.requests} req
                          </li>
                        ))}
                        {!analytics.topWorkspaces.length ? <li style={{ color: 'var(--muted)' }}>No usage yet</li> : null}
                      </ul>
                      <h3>Usage by feature</h3>
                      <ul>{analytics.usageByFeature.map((u) => <li key={u.feature}>{u.feature}: {u.units.toLocaleString()} ({u.events})</li>)}</ul>
                    </div>
                  </div>
                </section>
              )
            ) : null}

            {tab === 'audit' ? (
              <section className="vl-panel lg-admin-audit">
                <h2>Platform audit log</h2>
                {auditRows.length === 0 ? <p style={{ color: 'var(--muted)' }}>No admin events yet.</p> : (
                  <ul>{auditRows.map((row) => (
                    <li key={row.id}>
                      <strong>{row.action}</strong>
                      <span>{new Date(row.createdAt).toLocaleString()} · {row.actor?.email ?? row.actor?.name ?? 'system'}{row.targetOrganizationId ? ` · ${row.targetOrganizationId}` : ''}</span>
                      {row.route ? <code>{row.route}</code> : null}
                    </li>
                  ))}</ul>
                )}
              </section>
            ) : null}

            {tab === 'create' ? (
              <section className="vl-panel lg-admin-create">
                <h2>Create workspace</h2>
                <p style={{ color: 'var(--muted)' }}>Provision a customer organization with a default seat and optional owner email.</p>
                <div className="lg-admin-create-form">
                  <label>Name<input className="vl-input" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} /></label>
                  <label>Plan<select className="vl-input" value={createForm.plan} onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}>{PLANS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
                  <label>Owner email (optional)<input className="vl-input" value={createForm.ownerEmail} onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })} placeholder="customer@company.com" /></label>
                  <label>Region (optional)<input className="vl-input" value={createForm.dataRegion} onChange={(e) => setCreateForm({ ...createForm, dataRegion: e.target.value })} placeholder="us / eu / af" /></label>
                  <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void (async () => {
                    if (!createForm.name.trim()) { setError('Name is required'); return; }
                    setBusy(true);
                    try {
                      const token = await tokenFn();
                      const created = await apiFetch<{ id: string }>('/v1/admin/workspaces', { method: 'POST', token, body: JSON.stringify({ name: createForm.name.trim(), plan: createForm.plan, ownerEmail: createForm.ownerEmail.trim() || undefined, dataRegion: createForm.dataRegion.trim() || undefined }) });
                      setCreateForm({ name: '', plan: 'free', ownerEmail: '', dataRegion: '' });
                      setTab('directory'); setPage(1); await openDetail(created.id); await loadList(); setMessage('Workspace created');
                    } catch (err) {
                      setError(softFailMessage(err, 'Create failed'));
                    } finally { setBusy(false); }
                  })()}>Create workspace</button>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

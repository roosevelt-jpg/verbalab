'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

type SessionRow = {
  id: string;
  state: string;
  category: string;
  corridor: string;
  merchantLanguage: string;
  buyerLanguage: string;
  activeRevision: number;
  expiresAt: string;
  isDemo: boolean;
  isFixture: boolean;
  latestReceiptId: string | null;
  superseded: boolean;
  participants: Array<{ id: string; role: string; language: string; userId: string }>;
};

type ListResponse = {
  headline: string;
  sessions: SessionRow[];
};

const STATE_BUCKETS: Array<{ id: string; label: string; match: (s: SessionRow) => boolean }> = [
  {
    id: 'drafts',
    label: 'Drafts',
    match: (s) => s.state === 'draft',
  },
  {
    id: 'waiting_buyer',
    label: 'Waiting for buyer',
    match: (s) => s.state === 'invited' || (s.state === 'active' && s.participants.length < 2),
  },
  {
    id: 'waiting_confirmation',
    label: 'Waiting for confirmation',
    match: (s) =>
      ['reviewing', 'clarifying', 'awaiting_confirmations', 'active'].includes(s.state) &&
      s.participants.length >= 2 &&
      !s.latestReceiptId,
  },
  {
    id: 'issued',
    label: 'Issued receipts',
    match: (s) => Boolean(s.latestReceiptId) && !s.superseded,
  },
  {
    id: 'superseded',
    label: 'Superseded receipts',
    match: (s) => s.superseded,
  },
];

export function DealBridgeHomeClient() {
  const { getToken, isSignedIn } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('merchant-local');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [headline, setHeadline] = useState('Speak your language. Confirm the same deal.');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState<string | null>(null);

  const authHeaders = useCallback(async () => {
    if (isClerkConfigured() && isSignedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) {
      throw new Error('Sign in, or paste a lg_live_ / lg_test_ API key');
    }
    return { token: apiKey, actor: actorId };
  }, [apiKey, actorId, getToken, isSignedIn]);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const auth = await authHeaders();
      const res = await apiFetch<ListResponse>('/v1/dealbridge/sessions', {
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
      });
      setSessions(res.sessions);
      setHeadline(res.headline);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DealBridge sessions');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (isSignedIn || apiKey.startsWith('lg_')) {
      void refresh();
    }
  }, [isSignedIn, apiKey, refresh]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const auth = await authHeaders();
      const created = await apiFetch<{ id: string }>('/v1/dealbridge/sessions', {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        body: {
          category: 'wholesale_rice',
          merchantLanguage: 'en',
          buyerLanguage: 'fr',
          timeZone: 'Africa/Accra',
          pilotCohort: 'dealbridge',
        },
      });
      window.location.href = `/dealbridge/sessions/${created.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create deal');
    } finally {
      setCreating(false);
    }
  }

  async function onDemo() {
    setDemoRunning(true);
    setError(null);
    setDemoResult(null);
    try {
      const auth = await authHeaders();
      const res = await apiFetch<{
        label: string;
        sessionId: string;
        issuedReceiptId: string | null;
        staleConfirmationRejected: boolean;
        mismatchCheck: { status: string };
      }>('/v1/dealbridge/demo/run', {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
      });
      setDemoResult(
        `${res.label}: session ${res.sessionId}, mismatch=${res.mismatchCheck.status}, receipt=${res.issuedReceiptId}, staleRejected=${res.staleConfirmationRejected}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo failed');
    } finally {
      setDemoRunning(false);
    }
  }

  return (
    <main className="vl-page" style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.85rem' }}>Lugemi DealBridge</p>
        <h1 style={{ margin: '0.35rem 0', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: 1.15 }}>
          {headline}
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: 640 }}>
          Discuss trade in your preferred language, clarify important terms, and keep a shared record of
          what both parties confirmed.
        </p>
      </header>

      {!isSignedIn && (
        <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1rem', display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key (local / key auth)</span>
            <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Actor id header</span>
            <input className="vl-field" value={actorId} onChange={(e) => setActorId(e.target.value)} />
          </label>
        </section>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <form onSubmit={onCreate}>
          <button className="vl-btn" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'New deal'}
          </button>
        </form>
        <button className="vl-btn" type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        <button className="vl-btn" type="button" onClick={() => void onDemo()} disabled={demoRunning}>
          {demoRunning ? 'Running demo…' : 'Run simulated investor demo'}
        </button>
        <Link className="vl-btn" href="/admin/dealbridge">
          Pilot admin
        </Link>
      </div>

      {error && (
        <p role="alert" style={{ color: 'crimson', marginBottom: '1rem' }}>
          {error}
        </p>
      )}
      {demoResult && (
        <p className="vl-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <strong>SIMULATED / FIXTURE DEMO</strong> — {demoResult}
        </p>
      )}

      {STATE_BUCKETS.map((bucket) => {
        const rows = sessions.filter(bucket.match);
        return (
          <section key={bucket.id} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {bucket.label}{' '}
              <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({rows.length})</span>
            </h2>
            {rows.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>None</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                {rows.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/dealbridge/sessions/${s.id}`}
                      className="vl-panel"
                      style={{
                        display: 'block',
                        padding: '0.85rem 1rem',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <strong>{s.category}</strong> · {s.corridor} · {s.state}
                      {(s.isDemo || s.isFixture) && (
                        <span style={{ marginLeft: '0.5rem', color: 'var(--muted)' }}>
                          SIMULATED / FIXTURE DEMO
                        </span>
                      )}
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {s.merchantLanguage} → {s.buyerLanguage} · rev {s.activeRevision}
                        {s.latestReceiptId ? ` · receipt ${s.latestReceiptId.slice(0, 8)}…` : ''}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}

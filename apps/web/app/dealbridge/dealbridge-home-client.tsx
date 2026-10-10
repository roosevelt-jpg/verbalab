'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AppShell } from '@/components/app-shell';
import { FeaturePanel, PageHeader, PremiumCard, StatCard } from '@/components/platform';

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

  const issued = sessions.filter((s) => Boolean(s.latestReceiptId) && !s.superseded).length;
  const active = sessions.filter((s) => !['draft', 'closed', 'expired'].includes(s.state)).length;

  return (
    <AppShell>
      <div className="lg-page">
        <PageHeader
          eyebrow="DealBridge"
          title={headline}
          lede="Discuss trade in your preferred language, clarify important terms, and keep a shared record of what both parties confirmed."
          actions={
            <>
              <form onSubmit={onCreate}>
                <button className="vl-btn vl-btn-primary" type="submit" disabled={creating}>
                  {creating ? 'Creating…' : 'New deal'}
                </button>
              </form>
              <button className="vl-btn vl-btn-secondary" type="button" onClick={() => void refresh()} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button className="vl-btn vl-btn-secondary" type="button" onClick={() => void onDemo()} disabled={demoRunning}>
                {demoRunning ? 'Running demo…' : 'Run simulated demo'}
              </button>
              <Link className="vl-btn vl-btn-secondary" href="/admin/dealbridge">
                Pilot admin
              </Link>
            </>
          }
        >
          <p>
            Receipts prove integrity of the issued record—not translation accuracy or legal
            enforceability. Demo and fixture sessions stay labeled.
          </p>
        </PageHeader>

        <div className="lg-grid-stats">
          <StatCard label="Sessions" value={sessions.length} hint="In this workspace" />
          <StatCard label="Active" value={active} hint="Not draft or closed" />
          <StatCard label="Receipts" value={issued} hint="Issued and current" />
          <StatCard label="Corridor" value="Pilot" hint="Gated by ASR / translate / TTS" />
        </div>

        <section className="lg-page-section" aria-label="DealBridge pillars">
          <div className="lg-page-section__head">
            <h2 className="lg-type-section">Built for bilingual trade</h2>
            <p className="lg-type-body">
              Merchants and buyers keep their languages. Lugemi helps you clarify terms and capture a
              shared confirmation trail.
            </p>
          </div>
          <div className="lg-grid-3">
            <FeaturePanel
              icon="translate"
              title="Same meaning, two languages"
              body="Each party works in their preferred language while reviewing the same deal facts."
            />
            <FeaturePanel
              icon="shield"
              title="Dual confirmation"
              body="Critical terms require explicit confirmation from both sides before a receipt can issue."
            />
            <FeaturePanel
              icon="model"
              title="Honest demos"
              body="Fixture corridors are labeled. Unsupported language pairs return errors—never silent fake translation."
            />
          </div>
        </section>

        {!isSignedIn ? (
          <PremiumCard title="API key auth" meta={<span className="vl-tag">Local / key</span>}>
            <p className="lg-card__body">
              Sign in with Clerk for the full console, or paste a Lugemi API key for local actor-based
              testing.
            </p>
            <label className="vl-field-label" style={{ marginTop: '0.75rem' }}>
              API key
              <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="lg_test_…" />
            </label>
            <label className="vl-field-label" style={{ marginTop: '0.75rem' }}>
              Actor id header
              <input className="vl-field" value={actorId} onChange={(e) => setActorId(e.target.value)} />
            </label>
          </PremiumCard>
        ) : null}

        {error ? (
          <p role="alert" style={{ color: 'var(--bad)', margin: 0 }}>
            {error}
          </p>
        ) : null}
        {demoResult ? (
          <PremiumCard title="Simulated / fixture demo" flat>
            <p className="lg-card__body">{demoResult}</p>
          </PremiumCard>
        ) : null}

        {STATE_BUCKETS.map((bucket) => {
          const rows = sessions.filter(bucket.match);
          return (
            <section key={bucket.id} className="lg-page-section">
              <div className="lg-page-section__head">
                <h2 className="lg-type-section">
                  {bucket.label}{' '}
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>({rows.length})</span>
                </h2>
              </div>
              {rows.length === 0 ? (
                <p className="lg-type-compact">No sessions in this stage yet.</p>
              ) : (
                <div className="lg-grid-2">
                  {rows.map((s) => (
                    <PremiumCard
                      key={s.id}
                      href={`/dealbridge/sessions/${s.id}`}
                      title={s.category}
                      meta={
                        <>
                          <span className="vl-tag">{s.state}</span>
                          {(s.isDemo || s.isFixture) && <span className="vl-tag">Simulated</span>}
                        </>
                      }
                    >
                      <p className="lg-card__body">
                        {s.corridor} · {s.merchantLanguage} → {s.buyerLanguage} · rev {s.activeRevision}
                        {s.latestReceiptId ? ` · receipt ${s.latestReceiptId.slice(0, 8)}…` : ''}
                      </p>
                    </PremiumCard>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

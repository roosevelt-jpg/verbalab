'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

type SessionView = {
  id: string;
  state: string;
  headline: string;
  demoLabel: string | null;
  activeRevision: number;
  corridor: string;
  me: { participantId: string; role: string; language: string } | null;
  participants: Array<{ id: string; role: string; language: string; userId: string }>;
  turns: Array<{
    id: string;
    sequence: number;
    speakerRole: string;
    transcript: string | null;
    translation: { language: string; text: string; provider: string } | null;
    status: string;
  }>;
  activeSnapshot: {
    id: string;
    revision: number;
    contentHash: string;
    unresolvedFields: string[];
    terms: unknown;
    myPresentation: {
      id: string;
      language: string;
      summaryText: string;
      presentationHash: string;
      hasAudio: boolean;
      autoplay: boolean;
    } | null;
  } | null;
  checks: Array<{
    id: string;
    state: string;
    clarificationQuestion: string | null;
    clarificationField: string | null;
  }>;
  confirmations: Array<{ id: string; action: string; participantId: string }>;
  receipts: Array<{ id: string; issuedAt: string; supersededByReceiptId: string | null }>;
  noticeVersion: string;
};

export function DealBridgeSessionClient({ sessionId }: { sessionId: string }) {
  const { getToken, isSignedIn } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('merchant-local');
  const [view, setView] = useState<SessionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnText, setTurnText] = useState('');
  const [explainBack, setExplainBack] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [connectivity, setConnectivity] = useState<'online' | 'offline'>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'online',
  );

  const authHeaders = useCallback(async () => {
    if (isClerkConfigured() && isSignedIn) {
      const token = await getToken();
      if (!token) throw new Error('Missing session token');
      return { token, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
  }, [apiKey, actorId, getToken, isSignedIn]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const auth = await authHeaders();
      const res = await apiFetch<SessionView>(`/v1/dealbridge/sessions/${sessionId}`, {
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
      });
      setView(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    }
  }, [authHeaders, sessionId]);

  useEffect(() => {
    const on = () => setConnectivity('online');
    const off = () => setConnectivity('offline');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (isSignedIn || apiKey.startsWith('lg_')) void refresh();
  }, [isSignedIn, apiKey, refresh]);

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function consentAll() {
    await withBusy(async () => {
      const auth = await authHeaders();
      for (const purpose of ['processing', 'recording', 'retention'] as const) {
        await apiFetch(`/v1/dealbridge/sessions/${sessionId}/consents`, {
          method: 'POST',
          token: auth.token,
          headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
          body: { purpose, decision: 'granted' },
        });
      }
    });
  }

  async function mintInvite() {
    await withBusy(async () => {
      const auth = await authHeaders();
      const res = await apiFetch<{ token: string; joinPath: string }>(
        `/v1/dealbridge/sessions/${sessionId}/invites`,
        {
          method: 'POST',
          token: auth.token,
          headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
          body: {},
        },
      );
      setInviteUrl(`${window.location.origin}${res.joinPath}`);
    });
  }

  async function sendTurn(event: FormEvent) {
    event.preventDefault();
    await withBusy(async () => {
      const auth = await authHeaders();
      await apiFetch(`/v1/dealbridge/sessions/${sessionId}/turns`, {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        body: { text: turnText, language: view?.me?.language },
      });
      setTurnText('');
    });
  }

  async function propose() {
    await withBusy(async () => {
      const auth = await authHeaders();
      await apiFetch(`/v1/dealbridge/sessions/${sessionId}/snapshots`, {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        body: { expectedRevision: view?.activeRevision },
      });
    });
  }

  async function submitCheck() {
    if (!view?.activeSnapshot?.myPresentation) return;
    await withBusy(async () => {
      const auth = await authHeaders();
      await apiFetch(`/v1/dealbridge/sessions/${sessionId}/checks`, {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        body: {
          snapshotId: view.activeSnapshot!.id,
          presentationHash: view.activeSnapshot!.myPresentation!.presentationHash,
          responseText: explainBack,
        },
      });
    });
  }

  async function confirm(action: 'confirm' | 'change' | 'decline') {
    if (!view?.activeSnapshot?.myPresentation) return;
    await withBusy(async () => {
      const auth = await authHeaders();
      await apiFetch(`/v1/dealbridge/sessions/${sessionId}/confirmations`, {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        body: {
          snapshotId: view.activeSnapshot!.id,
          contentHash: view.activeSnapshot!.contentHash,
          presentationHash: view.activeSnapshot!.myPresentation!.presentationHash,
          action,
          idempotencyKey: `${action}-${view.activeSnapshot!.id}-${view.me?.participantId}-${Date.now()}`,
        },
      });
    });
  }

  return (
    <main className="vl-page" style={{ maxWidth: 880, margin: '0 auto', padding: '1.25rem 1rem 3rem' }}>
      <p style={{ margin: 0 }}>
        <Link href="/dealbridge">← DealBridge</Link>
      </p>
      <h1 style={{ marginTop: '0.75rem', fontSize: '1.75rem' }}>
        {view?.headline ?? 'Speak your language. Confirm the same deal.'}
      </h1>
      {view?.demoLabel && (
        <p role="status" style={{ fontWeight: 600 }}>
          {view.demoLabel}
        </p>
      )}
      <p style={{ color: 'var(--muted)' }}>
        Session {sessionId.slice(0, 10)}… · {view?.state ?? '…'} · rev {view?.activeRevision ?? '—'} ·{' '}
        connectivity {connectivity}
      </p>

      {!isSignedIn && (
        <section className="vl-panel" style={{ padding: '1rem', marginBottom: '1rem', display: 'grid', gap: '0.5rem' }}>
          <input
            className="vl-field"
            placeholder="API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <input
            className="vl-field"
            placeholder="Actor id"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
          />
        </section>
      )}

      {error && (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      )}

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className="vl-btn" type="button" disabled={busy} onClick={() => void consentAll()}>
          Accept processing + recording notices
        </button>
        <button className="vl-btn" type="button" disabled={busy} onClick={() => void mintInvite()}>
          Invite buyer
        </button>
        <button className="vl-btn" type="button" disabled={busy} onClick={() => void propose()}>
          Draft terms snapshot
        </button>
        <button className="vl-btn" type="button" disabled={busy} onClick={() => void refresh()}>
          Refresh
        </button>
      </section>
      {inviteUrl && (
        <p className="vl-panel" style={{ padding: '0.75rem 1rem' }}>
          Invite (single-use): <code style={{ wordBreak: 'break-all' }}>{inviteUrl}</code>
        </p>
      )}

      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem' }}>Conversation</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Original and translation shown per turn. Push-to-talk audio uploads are supported via the turns
          API after consent; this UI uses text turns for reliability on mobile browsers.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.65rem' }}>
          {(view?.turns ?? []).map((t) => (
            <li key={t.id} className="vl-panel" style={{ padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                #{t.sequence} · {t.speakerRole} · {t.status}
              </div>
              <div>{t.transcript}</div>
              {t.translation && (
                <div style={{ marginTop: '0.35rem', color: 'var(--muted)' }}>
                  → ({t.translation.language}) {t.translation.text}
                </div>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={sendTurn} style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Your message</span>
            <textarea
              className="vl-field"
              rows={3}
              value={turnText}
              onChange={(e) => setTurnText(e.target.value)}
              required
            />
          </label>
          <button className="vl-btn" type="submit" disabled={busy || connectivity === 'offline'}>
            Send turn
          </button>
        </form>
      </section>

      {view?.activeSnapshot && (
        <section style={{ marginTop: '1.75rem' }}>
          <h2 style={{ fontSize: '1.15rem' }}>Terms review</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Revision {view.activeSnapshot.revision}. Audio review is available on demand and never
            autoplays.
          </p>
          {view.activeSnapshot.myPresentation && (
            <div className="vl-panel" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
              <p style={{ marginTop: 0 }}>{view.activeSnapshot.myPresentation.summaryText}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                presentationHash {view.activeSnapshot.myPresentation.presentationHash.slice(0, 12)}…
              </p>
            </div>
          )}
          {view.activeSnapshot.unresolvedFields.length > 0 && (
            <p>Unresolved: {view.activeSnapshot.unresolvedFields.join(', ')}</p>
          )}
          <label style={{ display: 'grid', gap: '0.25rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Explain back key terms in your own words (quantity, currency, price/total, delivery, payment)
            </span>
            <textarea
              className="vl-field"
              rows={3}
              value={explainBack}
              onChange={(e) => setExplainBack(e.target.value)}
            />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="vl-btn" type="button" disabled={busy} onClick={() => void submitCheck()}>
              Submit explain-back
            </button>
            <button className="vl-btn" type="button" disabled={busy} onClick={() => void confirm('confirm')}>
              Confirm these terms
            </button>
            <button className="vl-btn" type="button" disabled={busy} onClick={() => void confirm('change')}>
              Request a change
            </button>
            <button className="vl-btn" type="button" disabled={busy} onClick={() => void confirm('decline')}>
              Decline
            </button>
          </div>
          {view.checks[0] && (
            <p style={{ marginTop: '0.75rem' }}>
              Latest check: <strong>{view.checks[0].state}</strong>
              {view.checks[0].clarificationQuestion
                ? ` — ${view.checks[0].clarificationQuestion}`
                : ''}
            </p>
          )}
        </section>
      )}

      {view?.receipts?.[0] && (
        <section style={{ marginTop: '1.75rem' }}>
          <h2 style={{ fontSize: '1.15rem' }}>Receipt</h2>
          <p>
            Issued {new Date(view.receipts[0].issuedAt).toLocaleString()} · id{' '}
            {view.receipts[0].id}
            {view.receipts[0].supersededByReceiptId ? ' · superseded' : ''}
          </p>
          <Link href={`/dealbridge/sessions/${sessionId}#receipt`}>View in session API receipt endpoint</Link>
        </section>
      )}
    </main>
  );
}

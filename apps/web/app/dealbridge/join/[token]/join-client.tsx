'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

type InvitePeek = {
  sessionId: string;
  category: string;
  corridor: string;
  merchantLanguage: string;
  buyerLanguage: string;
  inviteExpiresAt: string;
  redeemed: boolean;
  demoLabel: string | null;
  noticeVersion: string;
  recordingNotice: string;
};

export function DealBridgeJoinClient({ token }: { token: string }) {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('buyer-local');
  const [peek, setPeek] = useState<InvitePeek | null>(null);
  const [language, setLanguage] = useState('fr');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [trainingConsent, setTrainingConsent] = useState(false);

  const authHeaders = useCallback(async () => {
    if (isClerkConfigured() && isSignedIn) {
      const tokenJwt = await getToken();
      if (!tokenJwt) throw new Error('Missing session token');
      return { token: tokenJwt, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
  }, [apiKey, actorId, getToken, isSignedIn]);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const auth = await authHeaders();
        const res = await apiFetch<InvitePeek>(`/v1/dealbridge/invites/${token}`, {
          token: auth.token,
          headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        });
        setPeek(res);
        setLanguage(res.buyerLanguage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invite unavailable');
      }
    }
    if (isSignedIn || apiKey.startsWith('lg_')) void load();
  }, [authHeaders, token, isSignedIn, apiKey]);

  async function onJoin(event: FormEvent) {
    event.preventDefault();
    if (!peek) return;
    setBusy(true);
    setError(null);
    try {
      const auth = await authHeaders();
      await apiFetch(`/v1/dealbridge/sessions/${peek.sessionId}/join`, {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        body: { token, language },
      });
      for (const purpose of ['processing', 'recording', 'retention'] as const) {
        await apiFetch(`/v1/dealbridge/sessions/${peek.sessionId}/consents`, {
          method: 'POST',
          token: auth.token,
          headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
          body: { purpose, decision: 'granted', noticeVersion: peek.noticeVersion },
        });
      }
      await apiFetch(`/v1/dealbridge/sessions/${peek.sessionId}/consents`, {
        method: 'POST',
        token: auth.token,
        headers: auth.actor ? { 'X-DealBridge-Actor-Id': auth.actor } : undefined,
        body: {
          purpose: 'training',
          decision: trainingConsent ? 'granted' : 'denied',
          noticeVersion: peek.noticeVersion,
        },
      });
      router.push(`/dealbridge/sessions/${peek.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Join failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="vl-page" style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <p style={{ color: 'var(--muted)', margin: 0 }}>Lugemi DealBridge</p>
      <h1 style={{ marginTop: '0.35rem', fontSize: '1.8rem' }}>Join deal session</h1>
      {peek?.demoLabel && <p role="status"><strong>{peek.demoLabel}</strong></p>}

      {!isSignedIn && (
        <section className="vl-panel" style={{ padding: '1rem', margin: '1rem 0', display: 'grid', gap: '0.5rem' }}>
          <input className="vl-field" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <input className="vl-field" placeholder="Actor id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
        </section>
      )}

      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}

      {peek && (
        <form onSubmit={onJoin} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
          <p style={{ margin: 0 }}>
            Merchant session for <strong>{peek.category}</strong> ({peek.corridor}). Invite expires{' '}
            {new Date(peek.inviteExpiresAt).toLocaleString()}.
          </p>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{peek.recordingNotice}</p>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Your language</span>
            <select className="vl-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="fr">French (fr)</option>
              <option value="en">English (en)</option>
              <option value="ak">Akan/Twi (ak)</option>
            </select>
          </label>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={trainingConsent}
              onChange={(e) => setTrainingConsent(e.target.checked)}
            />
            <span style={{ fontSize: '0.9rem' }}>
              Optional: allow use of my recordings for model training (separate from service processing).
            </span>
          </label>
          <button className="vl-btn" type="submit" disabled={busy || peek.redeemed}>
            {peek.redeemed ? 'Invite already used' : busy ? 'Joining…' : 'Accept notices and join'}
          </button>
        </form>
      )}
    </main>
  );
}

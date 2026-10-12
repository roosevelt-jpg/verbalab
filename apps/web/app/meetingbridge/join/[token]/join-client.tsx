'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useStudioApiKeyField } from '@/hooks/use-studio-api-key';

type InvitePeek = {
  meetingId: string;
  title: string;
  corridor: string;
  timeZone: string;
  expiresAt: string;
  redeemed: boolean;
  noticeVersion: string;
  notices: {
    processing: string;
    recording: string;
    training: string;
  };
};

export function MeetingBridgeJoinClient({ token }: { token: string }) {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const { apiKey, setApiKey } = useStudioApiKeyField();
  const [actorId, setActorId] = useState('participant-local');
  const [peek, setPeek] = useState<InvitePeek | null>(null);
  const [speakingLanguage, setSpeakingLanguage] = useState('en');
  const [listeningLanguage, setListeningLanguage] = useState('ak');
  const [listeningMode, setListeningMode] = useState<'original' | 'translated' | 'captions_only'>(
    'captions_only',
  );
  const [processingConsent, setProcessingConsent] = useState(true);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [trainingConsent, setTrainingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signedIn = Boolean(isClerkConfigured() && isSignedIn);

  const authHeaders = useCallback(async () => {
    if (signedIn) {
      const jwt = await getToken();
      if (!jwt) throw new Error('Missing session token');
      return { token: jwt, actor: undefined as string | undefined };
    }
    if (!apiKey.startsWith('lg_')) throw new Error('Sign in or paste an API key');
    return { token: apiKey, actor: actorId };
  }, [apiKey, actorId, getToken, signedIn]);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const a = await authHeaders();
        const res = await apiFetch<InvitePeek>(`/v1/meetingbridge/invites/${token}`, {
          token: a.token,
          headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        });
        setPeek(res);
        const [aLang, bLang] = res.corridor.split('-');
        if (aLang) setSpeakingLanguage(aLang);
        if (bLang) setListeningLanguage(bLang);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invite unavailable');
      }
    }
    if (signedIn || apiKey.startsWith('lg_')) void load();
  }, [authHeaders, token, signedIn, apiKey]);

  async function onJoin(event: FormEvent) {
    event.preventDefault();
    if (!peek) return;
    if (!processingConsent) {
      setError('Processing consent is required to join captions and translation.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const a = await authHeaders();
      await apiFetch(`/v1/meetingbridge/meetings/${peek.meetingId}/join`, {
        method: 'POST',
        token: a.token,
        headers: a.actor ? { 'X-MeetingBridge-Actor-Id': a.actor } : undefined,
        body: {
          token,
          speakingLanguage,
          listeningLanguage,
          listeningMode,
          consents: [
            { purpose: 'processing', decision: 'granted' },
            { purpose: 'recording', decision: recordingConsent ? 'granted' : 'denied' },
            { purpose: 'retention', decision: recordingConsent ? 'granted' : 'denied' },
            { purpose: 'training', decision: trainingConsent ? 'granted' : 'denied' },
          ],
        },
      });
      router.push(`/meetingbridge/meetings/${peek.meetingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Join failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="lg-page" style={{ maxWidth: 720 }}>
        <PageHeader
          eyebrow="MeetingBridge"
          title="Join meeting"
          lede="Choose your speaking and listening languages. Recording and training consents are separate from live processing."
        >
          <div className="lg-page-header__actions">
            <Link href="/meetingbridge" className="vl-btn vl-btn-secondary">
              Meeting library
            </Link>
          </div>
        </PageHeader>

        {!signedIn && (
          <section className="lg-card" style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              className="vl-field"
              placeholder="API key (lg_…)"
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

        {error ? (
          <p className="lg-type-compact" role="alert" style={{ color: 'var(--bad, #b91c1c)' }}>
            {error}
          </p>
        ) : null}

        {peek ? (
          <form onSubmit={onJoin} className="lg-card" style={{ display: 'grid', gap: '0.85rem' }}>
            <p style={{ margin: 0 }}>
              <strong>{peek.title}</strong> · corridor {peek.corridor} · timezone {peek.timeZone}
            </p>
            <p className="lg-type-compact">
              Invite expires {new Date(peek.expiresAt).toLocaleString()}
              {peek.redeemed ? ' · already redeemed by you or another actor' : ''}
            </p>

            <label className="vl-field-label">
              Speaking language
              <input
                className="vl-field"
                value={speakingLanguage}
                onChange={(e) => setSpeakingLanguage(e.target.value)}
                required
              />
            </label>
            <label className="vl-field-label">
              Listening language
              <input
                className="vl-field"
                value={listeningLanguage}
                onChange={(e) => setListeningLanguage(e.target.value)}
                required
              />
            </label>
            <label className="vl-field-label">
              Listening mode
              <select
                className="vl-field"
                value={listeningMode}
                onChange={(e) => setListeningMode(e.target.value as typeof listeningMode)}
              >
                <option value="captions_only">Captions only (recommended)</option>
                <option value="original">Original</option>
                <option value="translated">Translated audio when available</option>
              </select>
            </label>

            <fieldset style={{ border: '1px solid var(--border, #ddd)', borderRadius: 8, padding: '0.75rem' }}>
              <legend className="lg-type-compact">Notices &amp; consent</legend>
              <p className="lg-type-compact">{peek.notices.processing}</p>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={processingConsent}
                  onChange={(e) => setProcessingConsent(e.target.checked)}
                />
                <span>I consent to live AI processing for captions and translation.</span>
              </label>
              <p className="lg-type-compact">{peek.notices.recording}</p>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={recordingConsent}
                  onChange={(e) => setRecordingConsent(e.target.checked)}
                />
                <span>I consent to persistent recording and retention (optional).</span>
              </label>
              <p className="lg-type-compact">{peek.notices.training}</p>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={trainingConsent}
                  onChange={(e) => setTrainingConsent(e.target.checked)}
                />
                <span>I consent to optional model training on my contributions (never automatic).</span>
              </label>
            </fieldset>

            <button type="submit" className="vl-btn vl-btn-primary" disabled={busy}>
              {busy ? 'Joining…' : 'Join meeting'}
            </button>
          </form>
        ) : (
          <p className="lg-type-compact">
            {signedIn || apiKey.startsWith('lg_')
              ? 'Loading invitation…'
              : 'Sign in or provide an API key to redeem this invitation.'}
          </p>
        )}
      </div>
    </AppShell>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { isClerkConfigured } from '@/lib/clerk-config';

export function VoiceBridgeJoinClient({ token }: { token: string }) {
  const { getToken, isSignedIn } = useAuth();
  const [peek, setPeek] = useState<{ title: string; noticeVersion: string } | null>(null);
  const [language, setLanguage] = useState('fr');
  const [apiKey, setApiKey] = useState('');
  const [actorId, setActorId] = useState('vb-member-2');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [recording, setRecording] = useState(true);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ title: string; noticeVersion: string; threadId: string }>(
          `/v1/voicebridge/invites/${token}`,
        );
        setPeek({ title: data.title, noticeVersion: data.noticeVersion });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invite unavailable');
      }
    })();
  }, [token]);

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const authToken =
        isClerkConfigured() && isSignedIn ? ((await getToken()) ?? undefined) : apiKey.trim() || undefined;
      const headers: Record<string, string> = {};
      if (!isClerkConfigured() || !isSignedIn) headers['X-VoiceBridge-Actor-Id'] = actorId;
      const view = await apiFetch<{ thread: { id: string } }>(`/v1/voicebridge/threads/_/join`, {
        method: 'POST',
        token: authToken,
        headers,
        body: JSON.stringify({
          token,
          language,
          consents: [
            { purpose: 'processing', decision: processing ? 'granted' : 'denied' },
            { purpose: 'recording', decision: recording ? 'granted' : 'denied' },
            { purpose: 'training', decision: training ? 'granted' : 'denied' },
          ],
        }),
      });
      window.location.href = `/voicebridge/threads/${view.thread.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Join failed');
    }
  }

  return (
    <main className="vl-page" style={{ maxWidth: 520, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Join VoiceBridge</h1>
      {peek ? (
        <p>
          Thread: <strong>{peek.title}</strong>
          <br />
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Notice {peek.noticeVersion}</span>
        </p>
      ) : null}
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
        Processing may access plaintext audio/transcripts on Lugemi servers and model providers. Training consent is
        optional and separate — denying training does not block normal service.
      </p>
      {!isClerkConfigured() || !isSignedIn ? (
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <input className="vl-input" placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <input className="vl-input" placeholder="Actor id" value={actorId} onChange={(e) => setActorId(e.target.value)} />
        </div>
      ) : null}
      <form onSubmit={onJoin} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: 10 }}>
        <label>
          Your language
          <input className="vl-input" required value={language} onChange={(e) => setLanguage(e.target.value)} />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={processing} onChange={(e) => setProcessing(e.target.checked)} />
          Grant processing consent (required)
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={recording} onChange={(e) => setRecording(e.target.checked)} />
          Grant recording consent
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={training} onChange={(e) => setTraining(e.target.checked)} />
          Optional training permission
        </label>
        <button className="vl-btn vl-btn-primary" type="submit">
          Join thread
        </button>
      </form>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
    </main>
  );
}

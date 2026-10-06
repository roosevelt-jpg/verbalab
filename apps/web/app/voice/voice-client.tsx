'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type VoiceStatus = {
  provider: string;
  disabled: boolean;
  twilioConfigured: boolean;
  authTokenConfigured: boolean;
  phoneNumberConfigured: boolean;
  webhookBaseConfigured: boolean;
  defaultVoice: string;
  inboundUrl: string | null;
  turnUrl: string | null;
  demoOrgConfigured: boolean;
  demoWorkspaceConfigured: boolean;
};

type SimResult = {
  userText: string;
  replyText: string;
  audioBase64: string;
  mimeType: string;
  providers: { stt: string | null; chat: string; tts: string };
};

export function VoiceClient() {
  const { getToken, isLoaded } = useAuth();
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const [text, setText] = useState('What is Lugemi?');
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setStatus(await apiFetch<VoiceStatus>('/v1/voice/status', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function simulate() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<SimResult>('/v1/voice/simulate', {
        method: 'POST',
        token,
        body: JSON.stringify({ text }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulate failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Voice FAQ
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        One bilingual phone demo: Twilio + STT + LLM + TTS. Not a call-center platform.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {status ? (
        <section className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.25rem', maxWidth: '42rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Twilio</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 0' }}>
            Configured: {status.twilioConfigured ? 'yes' : 'no'} · Auth token:{' '}
            {status.authTokenConfigured ? 'set' : 'missing'} · Phone:{' '}
            {status.phoneNumberConfigured ? 'set' : 'missing'}
            {status.disabled ? ' · DISABLED' : ''}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.75rem 0 0' }}>
            Inbound webhook: {status.inboundUrl ?? 'set TWILIO_WEBHOOK_BASE_URL'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Demo org/workspace: {status.demoOrgConfigured && status.demoWorkspaceConfigured ? 'set' : 'missing'}
          </p>
        </section>
      ) : null}

      <section className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.25rem', maxWidth: '42rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Simulate turn</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
          Runs FAQ LLM + TTS without placing a call (CI/dev path).
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={busy}
          style={{ width: '100%', fontFamily: 'inherit' }}
        />
        <button type="button" onClick={() => void simulate()} disabled={busy || !text.trim()} style={{ marginTop: '0.75rem' }}>
          Run simulate
        </button>
        {result ? (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ margin: 0 }}>
              <strong>Reply:</strong> {result.replyText}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Providers: chat={result.providers.chat}, tts={result.providers.tts}
            </p>
            {result.audioBase64 ? (
              <audio
                controls
                src={`data:${result.mimeType};base64,${result.audioBase64}`}
                style={{ marginTop: '0.75rem', width: '100%' }}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

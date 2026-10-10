'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import {
  NativeAccentVoicePicker,
  type VoicePickerValue,
} from '@/components/console/native-accent-voice-picker';
import { SITE_CONTENT } from '@/data/site-content';

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

type EmotionSnapshot = {
  label: string;
  confidence: number;
  sentiment: { label: string; confidence: number };
  tone: { label: string; confidence: number };
  honesty?: string;
  note: string;
};

type EmotionProfile = { id: string; name: string; category: string };

export function VoiceClient() {
  const { getToken, isLoaded } = useAuth();
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const [text, setText] = useState(
    'What languages and accents can Lugemi speaking agents use across African countries and ethnic communities?',
  );
  const [picker, setPicker] = useState<VoicePickerValue>({
    voiceId: SITE_CONTENT.sampleVoices[0]?.voiceId ?? 'own:sw-ke-female',
    gender: 'any',
    language: 'any',
    accent: 'any',
    country: 'any',
    toneStyle: 'customer_support',
    emotionProfile: 'customer_support',
  });
  const [profiles, setProfiles] = useState<EmotionProfile[]>([]);
  const [result, setResult] = useState<SimResult | null>(null);
  const [emotion, setEmotion] = useState<EmotionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    // Public status probe — no auth required (simulate/profiles still need a session).
    const st = await apiFetch<VoiceStatus>('/v1/voice/status');
    setStatus(st);

    const token = await getToken().catch(() => null);
    if (!token) return;
    try {
      const prof = await apiFetch<{ profiles: EmotionProfile[] }>('/v1/emotion-voice/profiles', {
        token,
      });
      if (prof.profiles?.length) setProfiles(prof.profiles);
    } catch {
      // Profiles are optional enrichment when signed in.
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function simulate() {
    setBusy(true);
    setError(null);
    setResult(null);
    setEmotion(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const [res, emo] = await Promise.all([
        apiFetch<SimResult>('/v1/voice/simulate', {
          method: 'POST',
          token,
          body: JSON.stringify({
            text,
            voice: picker.voiceId,
            emotion: picker.emotionProfile || undefined,
          }),
        }),
        apiFetch<EmotionSnapshot>('/v1/emotion/detect', {
          method: 'POST',
          token,
          body: JSON.stringify({ text }),
        }).catch(() => null),
      ]);
      setResult(res);
      if (emo) setEmotion(emo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulate failed');
    } finally {
      setBusy(false);
    }
  }

  function applyTemplate(id: string) {
    const t = SITE_CONTENT.agentTemplates.find((x) => x.id === id);
    if (!t) return;
    setText(t.script);
    const sample = SITE_CONTENT.sampleVoices.find(
      (v) =>
        t.language.toLowerCase().includes(v.language.toLowerCase().slice(0, 4)) ||
        t.accent.toLowerCase().includes(v.region.toLowerCase().slice(0, 4)),
    );
    if (sample) {
      setPicker((prev) => ({
        ...prev,
        voiceId: sample.voiceId,
        language: 'any',
        accent: 'any',
        country: 'any',
      }));
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Speaking agents · Voice FAQ
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', maxWidth: '42rem', lineHeight: 1.6 }}>
        Build agents that speak and listen with native-accent <code>own:*</code> voices. Select
        gender, tone/emotion style, accent/region, and language — then simulate STT → FAQ → TTS.
        Twilio inbound hooks when keys are set — not a call-center platform.
      </p>
      <p style={{ margin: '0.65rem 0 0', fontSize: '0.9rem' }}>
        <Link href="/emotion-intelligence">Emotion detection</Link>
        {' · '}
        <Link href="/emotion-voice">Emotion Voice</Link>
        {' · '}
        <Link href="/audio">Voice console</Link>
        {' · '}
        <Link href="/p/voice-agents">Agents product</Link>
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {status ? (
        <section className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.25rem', maxWidth: '46rem' }}>
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
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Default voice: <code>{status.defaultVoice}</code>
          </p>
        </section>
      ) : null}

      <section className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.25rem', maxWidth: '46rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Agent voice builder</h2>
        <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
            Template
          </span>
          <select
            onChange={(e) => applyTemplate(e.target.value)}
            defaultValue=""
            style={{ padding: '0.5rem 0.65rem', border: '1px solid var(--line)', borderRadius: '0.4rem' }}
          >
            <option value="" disabled>
              Apply Africa-first agent template…
            </option>
            {SITE_CONTENT.agentTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.language} · {t.accent}
              </option>
            ))}
          </select>
        </label>
        <NativeAccentVoicePicker
          value={picker}
          onChange={setPicker}
          preferOwn
          showEmotionTone
          emotionProfiles={profiles}
        />
      </section>

      <section className="vl-panel" style={{ marginTop: '1.25rem', padding: '1.25rem', maxWidth: '46rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Simulate turn</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
          Runs FAQ LLM + TTS with your selected <code>{picker.voiceId}</code>
          {picker.emotionProfile ? (
            <>
              {' '}
              (tone style <code>{picker.emotionProfile}</code> for Emotion Voice synthesis paths)
            </>
          ) : null}
          . Also detects emotional state / sentiment / tone of the user utterance.
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
              Providers: chat={result.providers.chat}, tts={result.providers.tts} · voice={picker.voiceId}
            </p>
            {result.audioBase64 ? (
              <div style={{ marginTop: '0.75rem' }}>
                <AudioPreviewBar
                  src={`data:${result.mimeType};base64,${result.audioBase64}`}
                  label="Play agent reply"
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {emotion ? (
          <div
            style={{
              marginTop: '1rem',
              borderTop: '1px solid var(--line)',
              paddingTop: '0.85rem',
              fontSize: '0.9rem',
            }}
          >
            <strong>User utterance affect (heuristic)</strong>
            <p style={{ margin: '0.35rem 0 0' }}>
              Emotional state: {emotion.label} ({emotion.confidence}) · Sentiment:{' '}
              {emotion.sentiment.label} · Tone: {emotion.tone.label}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {emotion.honesty ?? emotion.note}
            </p>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

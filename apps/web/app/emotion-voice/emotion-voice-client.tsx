'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Profile = {
  id: string;
  name: string;
  category: string;
  description: string;
  preferredVoice: string;
};
type Engine = {
  product: string;
  note: string;
  architecture: { trainedExpressiveModel: boolean };
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};

export function EmotionVoiceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [text, setText] = useState('Thank you for calling. How can I help you today?');
  const [emotion, setEmotion] = useState('customer_support');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, prof] = await Promise.all([
      apiFetch<Engine>('/v1/emotion-voice/engine', { token }),
      apiFetch<{ profiles: Profile[] }>('/v1/emotion-voice/profiles', { token }),
    ]);
    setEngine(eng);
    setProfiles(prof.profiles);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function synthesize() {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await fetch(`${API_URL}/v1/emotion-voice/synthesize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, emotion, format: 'mp3' }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMode(res.headers.get('X-Lugemi-Emotion-Mode'));
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synthesize failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        Emotion Voice
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Emotion and domain tone profiles for synthesis. Soft prosody + voice defaults — not a trained
        expressive TTS lab. Distinct from Speech Emotion detection.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <section style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem', marginBottom: '1.75rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Text</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} style={input} />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Emotion / domain profile</span>
          <select value={emotion} onChange={(e) => setEmotion(e.target.value)} style={input}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.category} → {p.preferredVoice}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <button type="button" disabled={busy} onClick={() => void synthesize()} style={primaryBtn}>
            Synthesize
          </button>
          <Link href="/emotion-intelligence" style={secondaryBtn}>
            Emotion detection
          </Link>
          <Link href="/neural-tts" style={secondaryBtn}>
            Neural TTS
          </Link>
          <Link href="/voice-cloud" style={secondaryBtn}>
            Voice Cloud
          </Link>
        </div>
        {mode ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>Mode: {mode}</p>
        ) : null}
        {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
      </section>

      {engine ? (
        <section>
          <h2 style={label}>Honesty</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>{engine.note}</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Trained expressive model:{' '}
            {engine.architecture.trainedExpressiveModel ? 'yes' : 'no (not claimed)'}
          </p>
          <ul style={{ margin: '1rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
            {engine.capabilities
              .filter((c) => ['emotion-profiles', 'emotion-synthesis', 'streaming', 'analytics'].includes(c.id))
              .map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                  <strong>
                    {c.name}
                  </strong>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
          </ul>
        </section>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      )}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
};

const input: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  padding: '0.65rem 0.75rem',
  font: 'inherit',
  background: '#fff',
};

const primaryBtn: React.CSSProperties = {
  border: 'none',
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--ink)',
  background: '#fff',
};

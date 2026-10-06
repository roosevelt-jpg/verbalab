'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Profile = { id: string; name: string; category: string; description: string };
type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
  honesty: { spectralMlDenoise: boolean; liveAec: boolean };
};

export function VoiceEnhancementClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState('microphone_cleanup');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [echoNote, setEchoNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, prof, echo] = await Promise.all([
      apiFetch<Engine>('/v1/voice-enhancement/engine', { token }),
      apiFetch<{ profiles: Profile[] }>('/v1/voice-enhancement/profiles', { token }),
      apiFetch<{ note: string; status: string }>('/v1/voice-enhancement/echo', { token }),
    ]);
    setEngine(eng);
    setProfiles(prof.profiles);
    setEchoNote(`${echo.status}: ${echo.note}`);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function enhance {
    if (!file) {
      setError('Choose an audio file');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const form = new FormData;
      form.append('file', file);
      form.append('profile', profile);
      const res = await fetch(`${API_URL}/v1/voice-enhancement/enhance`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json;
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      const bin = atob(body.audioBase64 as string);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(new Blob([bytes], { type: body.mimeType })));
      setMeta(
        `${body.profile} · SNR ${body.before?.estimatedSnrDb} → ${body.after?.estimatedSnrDb} dB · ${body.note}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enhance failed');
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
        Voice Enhancement
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Cleanup profiles over Audio Intelligence PCM heuristics — mic, podcast, meeting, broadcast,
        restore. Not Krisp or Adobe Enhance.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {echoNote ? <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{echoNote}</p> : null}

      <section style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem', marginBottom: '1.75rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Profile</span>
          <select value={profile} onChange={(e) => setProfile(e.target.value)} style={input}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Audio file (WAV preferred)</span>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button type="button" disabled={busy} onClick={ => void enhance} style={primary}>
          {busy ? 'Enhancing…' : 'Enhance'}
        </button>
        {meta ? <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{meta}</p> : null}
        {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
      </section>

      {profiles.length ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={h2}>Profiles</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {profiles.map((p) => (
              <li key={p.id} style={{ marginBottom: '0.35rem' }}>
                <strong>{p.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{p.description}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {engine ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={h2}>Capabilities</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
          <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.35rem' }}>
                <strong>{c.name}</strong> · {c.status}
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        <Link href="/audio-intelligence">Audio Intelligence</Link>
        {' · '}
        <Link href="/voice-cloud">Voice Cloud</Link>
        {' · '}
        <Link href="/voice-studio">Voice Studio</Link>
      </p>
    </AppShell>
  );
}

const label: CSSProperties = { fontSize: '0.85rem', fontWeight: 550 };
const h2: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  fontWeight: 650,
  margin: '0 0 0.5rem',
};
const input: CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  font: 'inherit',
  background: '#fff',
};
const primary: CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  background: 'var(--ink)',
  color: '#fff',
  fontWeight: 550,
  cursor: 'pointer',
  width: 'fit-content',
};

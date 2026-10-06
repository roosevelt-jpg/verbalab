'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
  honesty: { nistCertified: boolean; padCertified: boolean };
};
type Profile = { id: string; displayName: string; enrolled: boolean; fingerprintEncrypted?: boolean };

export function VoiceBiometricsClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, prof, ch] = await Promise.all([
      apiFetch<Engine>('/v1/voice-biometrics/engine', { token }),
      apiFetch<{ data: Profile[] }>('/v1/speakers/profiles', { token }),
      apiFetch<{ phrase: string; note: string }>('/v1/voice-biometrics/liveness/challenge', {
        token,
      }),
    ]);
    setEngine(eng);
    setProfiles(prof.data);
    if (prof.data[0] && !profileId) setProfileId(prof.data[0].id);
    setChallenge(`${ch.phrase} — ${ch.note}`);
  }, [getToken, profileId]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function post(path: string, extra: Record<string, string> = {}) {
    if (!file) throw new Error('Choose an audio file');
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const form = new FormData();
      form.append('file', file);
      for (const [k, v] of Object.entries(extra)) form.append(k, v);
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setResult(JSON.stringify(body, null, 2));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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
        Voice Biometrics
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Encrypted templates, deletion, heuristic anti-spoof/liveness, and composite auth over Speaker
        Intelligence. Not NIST/PAD certified.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {challenge ? <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Challenge: {challenge}</p> : null}

      <section style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem', marginBottom: '1.75rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Profile</span>
          <select value={profileId} onChange={(e) => setProfileId(e.target.value)} style={input}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
                {p.fingerprintEncrypted ? ' (encrypted)' : ''}
                {!p.enrolled ? ' — not enrolled' : ''}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Audio file</span>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            disabled={busy || !profileId}
            onClick={() => void post('/v1/voice-biometrics/enroll', { profileId, enableAuthFactor: 'true' })}
            style={primary}
          >
            Secure enroll
          </button>
          <button
            type="button"
            disabled={busy || !profileId}
            onClick={() => void post('/v1/voice-biometrics/authenticate', { profileId })}
            style={secondary}
          >
            Authenticate
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void post('/v1/voice-biometrics/anti-spoof')}
            style={secondary}
          >
            Anti-spoof
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void post('/v1/voice-biometrics/liveness')}
            style={secondary}
          >
            Liveness
          </button>
        </div>
        {result ? (
          <pre
            style={{
              margin: 0,
              padding: '0.75rem',
              background: 'var(--bg-soft)',
              borderRadius: 8,
              fontSize: '0.8rem',
              overflow: 'auto',
            }}
          >
            {result}
          </pre>
        ) : null}
      </section>

      {engine ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={h2}>Capabilities</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
          <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.35rem' }}>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        <Link href="/speaker-intelligence">Speaker Intelligence</Link>
        {' · '}
        <Link href="/voice-cloud">Voice Cloud</Link>
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
};
const secondary: CSSProperties = {
  ...primary,
  background: 'var(--bg-soft)',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
};

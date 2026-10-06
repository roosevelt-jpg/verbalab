'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Profile = {
  id: string;
  displayName: string;
  status: string;
  enrolled: boolean;
  enrollmentCount: number;
};
type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type HistoryItem = { id: string; action: string; score: number | null; decision: string | null; createdAt: string };

export function SpeakerIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, prof, hist] = await Promise.all([
      apiFetch<Engine>('/v1/speakers/engine', { token }),
      apiFetch<{ data: Profile[] }>('/v1/speakers/profiles', { token }),
      apiFetch<{ data: HistoryItem[] }>('/v1/speakers/history?limit=20', { token }),
    ]);
    setEngine(eng);
    setProfiles(prof.data);
    setHistory(hist.data);
    if (!selectedId && prof.data[0]) setSelectedId(prof.data[0].id);
  }, [getToken, selectedId]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function authHeaders() {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    return { Authorization: `Bearer ${token}` };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = await getToken();
    if (!token || !name.trim()) return;
    await apiFetch('/v1/speakers/profiles', {
      token,
      method: 'POST',
      body: JSON.stringify({ displayName: name.trim() }),
    });
    setName('');
    await refresh();
  }

  async function postMultipart(path: string, extra: Record<string, string> = {}) {
    if (!file) throw new Error('Choose an audio file');
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const headers = await authHeaders();
      const form = new FormData();
      form.append('file', file);
      for (const [k, v] of Object.entries(extra)) form.append(k, v);
      const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setResult(JSON.stringify(body, null, 2));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
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
        Speaker Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Profiles, local voice fingerprints, verify/identify, and gap-based diarization.{' '}
        <Link href="/speech">Speech Cloud</Link>. Not NIST biometrics.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Create profile</h2>
          <form onSubmit={(e) => void onCreate(e)} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              style={input}
            />
            <button type="submit" style={secondary}>
              Create
            </button>
          </form>
          <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
            {profiles.map((p) => (
              <li key={p.id} style={{ borderTop: '1px solid var(--line)', padding: '0.45rem 0' }}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontWeight: selectedId === p.id ? 700 : 500,
                    color: 'var(--ink)',
                  }}
                >
                  {p.displayName}
                </button>{' '}
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  · {p.status}
                  {p.enrolled ? ` · enrolled ×${p.enrollmentCount}` : ' · not enrolled'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 style={label}>Audio actions</h2>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              disabled={loading || !file || !selectedId}
              style={primary}
              onClick={() => void postMultipart(`/v1/speakers/profiles/${selectedId}/enroll`)}
            >
              Enroll
            </button>
            <button
              type="button"
              disabled={loading || !file || !selectedId}
              style={secondary}
              onClick={() => void postMultipart('/v1/speakers/verify', { profileId: selectedId })}
            >
              Verify
            </button>
            <button
              type="button"
              disabled={loading || !file}
              style={secondary}
              onClick={() => void postMultipart('/v1/speakers/identify')}
            >
              Identify
            </button>
            <button
              type="button"
              disabled={loading || !file}
              style={secondary}
              onClick={() => void postMultipart('/v1/speakers/diarize')}
            >
              Diarize
            </button>
          </div>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{result}</pre>
          </section>
        ) : null}

        <section>
          <h2 style={label}>History</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {history.map((h) => (
              <li key={h.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0', fontSize: '0.9rem' }}>
                <strong>{h.action}</strong>
                {h.decision ? ` · ${h.decision}` : ''}
                {h.score != null ? ` · score ${h.score}` : ''}{' '}
                <span style={{ color: 'var(--muted)' }}>{h.createdAt.slice(0, 19)}</span>
              </li>
            ))}
          </ul>
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Engine</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.45rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const input: React.CSSProperties = {
  padding: '0.55rem 0.7rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontSize: '0.95rem',
  flex: 1,
};

const primary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const secondary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  background: 'transparent',
  color: 'var(--ink)',
  cursor: 'pointer',
};

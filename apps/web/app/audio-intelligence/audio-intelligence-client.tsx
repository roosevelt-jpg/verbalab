'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type Analytics = { total: number; byAction: Record<string, number>; windowDays: number };

export function AudioIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isolatedUrl, setIsolatedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, stats] = await Promise.all([
      apiFetch<Engine>('/v1/audio-intelligence/engine', { token }),
      apiFetch<Analytics>('/v1/audio-intelligence/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(stats);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function authHeaders() {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    return { Authorization: `Bearer ${token}` };
  }

  async function postMultipart(path: string, extra: Record<string, string> = {}) {
    if (!file) throw new Error('Choose an audio file');
    setLoading(true);
    setError(null);
    setResult(null);
    if (isolatedUrl) {
      URL.revokeObjectURL(isolatedUrl);
      setIsolatedUrl(null);
    }
    try {
      const headers = await authHeaders();
      const form = new FormData();
      form.append('file', file);
      for (const [k, v] of Object.entries(extra)) form.append(k, v);
      const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      if (typeof body?.audioBase64 === 'string') {
        const binary = atob(body.audioBase64 as string);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: (body.mimeType as string) || 'audio/wav' });
        setIsolatedUrl(URL.createObjectURL(blob));
        const { audioBase64: _drop, ...meta } = body as Record<string, unknown>;
        setResult(JSON.stringify(meta, null, 2));
      } else {
        setResult(JSON.stringify(body, null, 2));
      }
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
        Audio Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Noise/silence analysis, noise-gate enhancement, linear upscaling, and energy VAD voice
        isolation. Echo cancellation and neural stem-separation OS are not on this surface. For Instant
        Voice Cloning samples, open <Link href="/audio?tab=extract">Voice Studio → Extract</Link>.{' '}
        <Link href="/speech">Speech Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Last {analytics.windowDays}d: {analytics.total} audio intelligence actions
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Audio file</h2>
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              disabled={loading || !file}
              style={primary}
              onClick={() => void postMultipart('/v1/audio-intelligence/analyze')}
            >
              Analyze
            </button>
            <button
              type="button"
              disabled={loading || !file}
              style={secondary}
              onClick={() => void postMultipart('/v1/audio-intelligence/silence')}
            >
              Silence
            </button>
            <button
              type="button"
              disabled={loading || !file}
              style={secondary}
              onClick={() => void postMultipart('/v1/audio-intelligence/enhance')}
            >
              Enhance
            </button>
            <button
              type="button"
              disabled={loading || !file}
              style={secondary}
              onClick={() => void postMultipart('/v1/audio-intelligence/upscale', { targetRate: '32000' })}
            >
              Upscale
            </button>
            <button
              type="button"
              disabled={loading || !file}
              style={secondary}
              onClick={() => void postMultipart('/v1/audio-intelligence/isolate')}
            >
              Isolate
            </button>
          </div>
        </section>

        {isolatedUrl ? (
          <section>
            <h2 style={label}>Isolated audio</h2>
            <p style={{ margin: '0 0 0.65rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              Energy VAD isolate + multi-band stems. Use as a clone sample in Voice Studio.
            </p>
            <AudioPreviewBar src={isolatedUrl} label="Play isolated audio" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              <a
                href={isolatedUrl}
                download="lugemi-isolated.wav"
                style={{ ...secondary, textDecoration: 'none' }}
              >
                Download WAV
              </a>
              <Link href="/audio?tab=clone" style={{ ...primary, textDecoration: 'none' }}>
                Open Instant clone
              </Link>
            </div>
          </section>
        ) : null}

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <pre
              style={{
                margin: 0,
                padding: '0.85rem',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '0.45rem',
                overflow: 'auto',
                fontSize: '0.8rem',
                maxHeight: '28rem',
              }}
            >
              {result}
            </pre>
          </section>
        ) : null}

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

const primary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  width: 'fit-content',
};

const secondary: React.CSSProperties = {
  ...primary,
  background: 'transparent',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
};

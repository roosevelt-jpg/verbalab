'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
};

type Voice = {
  id: string;
  name: string;
  gender: string;
  languages: string[];
  personality: string;
  accent: string | null;
  category: string;
};

type Analytics = {
  periodStart: string;
  tts: { requests: number; characters: number };
};

export function NeuralTtsClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [text, setText] = useState('Karibu Lugemi Neural TTS.');
  const [voice, setVoice] = useState('alloy');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [streamNote, setStreamNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, voiceRes, stats] = await Promise.all([
      apiFetch<Engine>('/v1/tts/engine', { token }),
      apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token }),
      apiFetch<Analytics>('/v1/tts/engine/analytics', { token }),
    ]);
    setEngine(eng);
    setVoices(voiceRes.data);
    setAnalytics(stats);
    if (voiceRes.data[0] && !voiceRes.data.some((v) => v.id === voice)) {
      setVoice(voiceRes.data[0].id);
    }
  }, [getToken, voice]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function synthesize(mode: 'batch' | 'stream') {
    setBusy(true);
    setError(null);
    setStreamNote(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      if (mode === 'batch') {
        const res = await fetch(`${API_URL}/v1/tts/synthesize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voice, format: 'mp3' }),
        });
        if (!res.ok) throw new Error(await res.text);
        const blob = await res.blob;
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
      } else {
        const res = await fetch(`${API_URL}/v1/tts/stream`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voice, format: 'mp3' }),
        });
        if (!res.ok) throw new Error(await res.text);
        const raw = await res.text;
        const chunks: Uint8Array[] = [];
        let note = 'chunk SSE';
        for (const block of raw.split('\n\n')) {
          const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice(6)) as {
            event: string;
            data?: string;
            note?: string;
            chunks?: number;
          };
          if (payload.event === 'meta' && payload.note) note = payload.note;
          if (payload.event === 'audio' && payload.data) {
            const bin = atob(payload.data);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
            chunks.push(bytes);
          }
        }
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(new Blob([merged], { type: 'audio/mpeg' })));
        setStreamNote(note);
      }
      await load;
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
        Neural TTS
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Batch synthesize and chunk-SSE streaming over OpenAI, own rented, and clone voices. Extends
        existing speech APIs — not a second TTS stack.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          This period: {analytics.tts.requests} TTS req · {analytics.tts.characters} chars
        </p>
      ) : null}

      <section style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem', marginBottom: '1.75rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Text</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            style={input}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={label}>Voice</span>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} style={input}>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.gender} · {v.category}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <button type="button" disabled={busy} onClick={ => void synthesize('batch')} style={primaryBtn}>
            Synthesize
          </button>
          <button type="button" disabled={busy} onClick={ => void synthesize('stream')} style={secondaryBtn}>
            Stream (chunk SSE)
          </button>
          <Link href="/audio" style={secondaryBtn}>
            Voice Studio
          </Link>
          <Link href="/voice-cloud" style={secondaryBtn}>
            Voice Cloud
          </Link>
        </div>
        {streamNote ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{streamNote}</p>
        ) : null}
        {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : null}
      </section>

      {engine ? (
        <section>
          <h2 style={label}>Capabilities</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>{engine.note}</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                <strong>
                  {c.name} · {c.status}
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
  cursor: 'pointer',
};

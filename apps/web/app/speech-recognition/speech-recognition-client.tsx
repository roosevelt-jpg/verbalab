'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };
type Engine = { product: string; note: string; capabilities: Capability[] };
type Segment = { id: number; start: number; end: number; text: string; confidence?: number };
type Recognition = {
  text: string;
  language: string | null;
  durationSeconds: number;
  provider: string;
  confidence: number | null;
  segments: Segment[];
  vocabularyApplied: boolean;
  industryPacks: string[];
};
type VocabTerm = { id: string; phrase: string };
type Pack = { id: string; name: string; description: string; phraseCount: number };

export function SpeechRecognitionClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [terms, setTerms] = useState<VocabTerm[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('');
  const [industry, setIndustry] = useState<string[]>([]);
  const [result, setResult] = useState<Recognition | null>(null);
  const [subtitles, setSubtitles] = useState<string | null>(null);
  const [streamLog, setStreamLog] = useState<string[]>([]);
  const [phrase, setPhrase] = useState('');
  const [analytics, setAnalytics] = useState<{ stt: { requests: number; minutes: number } } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authHeaders = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, packRes, vocab, usage] = await Promise.all([
      apiFetch<Engine>('/v1/speech/engine', { token }),
      apiFetch<{ packs: Pack[] }>('/v1/speech/vocabulary/packs', { token }),
      apiFetch<{ terms: VocabTerm[] }>('/v1/speech/vocabulary', { token }),
      apiFetch<{ stt: { requests: number; minutes: number } }>('/v1/speech/engine/analytics', {
        token,
      }),
    ]);
    setEngine(eng);
    setPacks(packRes.packs);
    setTerms(vocab.terms);
    setAnalytics(usage);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function onRecognize(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setSubtitles(null);
    try {
      const headers = await authHeaders();
      const form = new FormData();
      form.append('file', file);
      if (language) form.append('language', language);
      if (industry.length) form.append('industryPacks', industry.join(','));
      const res = await fetch(`${API_URL}/v1/speech/recognize`, { method: 'POST', headers, body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setResult(body);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recognize failed');
    } finally {
      setLoading(false);
    }
  }

  async function onStream() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setStreamLog([]);
    try {
      const headers = await authHeaders();
      const form = new FormData();
      form.append('file', file);
      if (language) form.append('language', language);
      if (industry.length) form.append('industryPacks', industry.join(','));
      const res = await fetch(`${API_URL}/v1/speech/stream`, { method: 'POST', headers, body: form });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const dataLine = part.split('\n').find((l) => l.startsWith('data: '));
          if (dataLine) setStreamLog((prev) => [...prev, dataLine.slice(6)]);
        }
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream failed');
    } finally {
      setLoading(false);
    }
  }

  async function onSubtitles() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const form = new FormData();
      form.append('file', file);
      form.append('format', 'srt');
      if (language) form.append('language', language);
      const res = await fetch(`${API_URL}/v1/speech/subtitles`, { method: 'POST', headers, body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      setSubtitles(body.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subtitles failed');
    } finally {
      setLoading(false);
    }
  }

  async function onAddPhrase(e: FormEvent) {
    e.preventDefault();
    const token = await getToken();
    if (!token || !phrase.trim()) return;
    await apiFetch('/v1/speech/vocabulary', {
      token,
      method: 'POST',
      body: JSON.stringify({ phrase: phrase.trim() }),
    });
    setPhrase('');
    await refresh();
  }

  function togglePack(id: string) {
    setIndustry((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
        Speech Recognition
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '42rem' }}>
        Batch and segment-stream STT with vocabulary, timestamps, confidence, and subtitles.{' '}
        <Link href="/speech">Speech Cloud hub</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          This period: {analytics.stt.requests} STT requests · {analytics.stt.minutes} min
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Recognize</h2>
          <form onSubmit={onRecognize} style={{ display: 'grid', gap: '0.75rem' }}>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Language (blank = auto-detect)
              </span>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en / sw / yo / am / fr"
                style={input}
              />
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {packs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePack(p.id)}
                  style={{
                    ...chip,
                    background: industry.includes(p.id) ? 'var(--ink)' : 'transparent',
                    color: industry.includes(p.id) ? '#fff' : 'var(--ink)',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button type="submit" disabled={loading || !file} style={primary}>
                Recognize
              </button>
              <button type="button" disabled={loading || !file} onClick={() => void onStream()} style={secondary}>
                Stream SSE
              </button>
              <button
                type="button"
                disabled={loading || !file}
                onClick={() => void onSubtitles()}
                style={secondary}
              >
                Subtitles (SRT)
              </button>
            </div>
          </form>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.text}</p>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {result.provider} · {result.durationSeconds}s · lang {result.language ?? '—'} · confidence{' '}
              {result.confidence ?? '—'} · segments {result.segments.length}
              {result.vocabularyApplied ? ' · vocabulary applied' : ''}
            </p>
            {result.segments.length ? (
              <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
                {result.segments.map((s) => (
                  <li key={s.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {s.start.toFixed(1)}–{s.end.toFixed(1)}s
                      {s.confidence != null ? ` · ${s.confidence}` : ''}
                    </span>
                    <div>{s.text}</div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {subtitles ? (
          <section>
            <h2 style={label}>SRT</h2>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{subtitles}</pre>
          </section>
        ) : null}

        {streamLog.length ? (
          <section>
            <h2 style={label}>SSE events</h2>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
              {streamLog.join('\n')}
            </pre>
          </section>
        ) : null}

        <section>
          <h2 style={label}>Custom vocabulary</h2>
          <form onSubmit={(e) => void onAddPhrase(e)} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Add phrase"
              style={{ ...input, flex: 1 }}
            />
            <button type="submit" style={secondary}>
              Add
            </button>
          </form>
          <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
            {terms.map((t) => (
              <li key={t.id} style={{ padding: '0.25rem 0', borderTop: '1px solid var(--line)' }}>
                {t.phrase}
              </li>
            ))}
          </ul>
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Engine capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.5rem 0' }}>
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

const chip: React.CSSProperties = {
  padding: '0.35rem 0.7rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontSize: '0.85rem',
  fontWeight: 550,
  cursor: 'pointer',
};

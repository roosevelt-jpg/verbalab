'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  defaultWakePhrases: string[];
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type Keyword = { id: string; phrase: string; kind: string; enabled: boolean };
type Analytics = { total: number; wakeHits: number; customKeywords: number; windowDays: number };
type DetectResult = {
  wakeDetected: boolean;
  transcript: string;
  hits: Array<{ phrase: string; kind: string }>;
  note: string;
};

export function WakeWordClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [phrase, setPhrase] = useState('escalate to human');
  const [kind, setKind] = useState('trigger');
  const [text, setText] = useState('Hey Lugemi, please escalate to human now.');
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, list, stats] = await Promise.all([
      apiFetch<Engine>('/v1/wake-word/engine', { token }),
      apiFetch<{ data: Keyword[] }>('/v1/wake-word/keywords', { token }),
      apiFetch<Analytics>('/v1/wake-word/analytics', { token }),
    ]);
    setEngine(eng);
    setKeywords(list.data);
    setAnalytics(stats);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/wake-word/keywords', {
        token,
        method: 'POST',
        body: JSON.stringify({ phrase, kind }),
      });
      setPhrase('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed');
    } finally {
      setLoading(false);
    }
  }

  async function onDetect(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<DetectResult>('/v1/wake-word/detect', {
        token,
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setResult(body);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detect failed');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    await apiFetch(`/v1/wake-word/keywords/${id}`, { token, method: 'DELETE' });
    await refresh();
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
        Wake Word Engine
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Detect wake phrases, spot keywords, and fire enterprise trigger phrases from text or
        audio→STT. Not Porcupine on-device DNN. <Link href="/speech">Speech Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Last {analytics.windowDays}d: {analytics.total} actions · {analytics.wakeHits} wake hits ·{' '}
          {analytics.customKeywords} custom phrases
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Detect</h2>
          <form onSubmit={(e) => void onDetect(e)} style={{ display: 'grid', gap: '0.65rem' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              style={{ ...input, resize: 'vertical' }}
            />
            <button type="submit" disabled={loading || !text.trim()} style={primary}>
              Detect wake words
            </button>
          </form>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {result.wakeDetected ? 'Wake detected' : 'No wake phrase'} · {result.hits.length} hits
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {result.note}
            </p>
            <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
              {result.hits.map((h, i) => (
                <li key={`${h.phrase}-${i}`} style={{ borderTop: '1px solid var(--line)', padding: '0.35rem 0' }}>
                  {h.phrase} · {h.kind}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 style={label}>Custom phrases</h2>
          <form onSubmit={(e) => void onAdd(e)} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="phrase"
              style={input}
            />
            <select value={kind} onChange={(e) => setKind(e.target.value)} style={input}>
              <option value="wake_word">wake_word</option>
              <option value="keyword">keyword</option>
              <option value="trigger">trigger</option>
            </select>
            <button type="submit" disabled={loading || !phrase.trim()} style={primary}>
              Add
            </button>
          </form>
          <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
            {keywords.map((k) => (
              <li
                key={k.id}
                style={{
                  borderTop: '1px solid var(--line)',
                  padding: '0.45rem 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <span>
                  {k.phrase}{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>· {k.kind}</span>
                </span>
                <button type="button" style={linkBtn} onClick={() => void onDelete(k.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Defaults</h2>
            <p style={{ margin: 0 }}>{engine.defaultWakePhrases.join(' · ')}</p>
            <h2 style={{ ...label, marginTop: '1.25rem' }}>Engine</h2>
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

const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

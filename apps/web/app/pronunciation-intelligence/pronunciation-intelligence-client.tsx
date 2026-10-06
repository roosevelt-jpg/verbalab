'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type Analytics = {
  total: number;
  averageOverall: number | null;
  windowDays: number;
};
type AssessResult = {
  hypothesis: string;
  scores: {
    overall: number;
    accuracy: number;
    fluency: number;
    stress: number;
    wordErrorRate: number;
  };
  coaching: Array<{ id: string; severity: string; message: string }>;
  note: string;
};

export function PronunciationIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [reference, setReference] = useState('Hello world, thank you for learning languages.');
  const [hypothesis, setHypothesis] = useState('Hello world thank you for learning languages');
  const [language, setLanguage] = useState('en');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AssessResult | null>(null);
  const [phonemes, setPhonemes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, stats] = await Promise.all([
      apiFetch<Engine>('/v1/pronunciation/engine', { token }),
      apiFetch<Analytics>('/v1/pronunciation/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(stats);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function onAssess(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('reference', reference);
        form.append('language', language);
        const res = await fetch(`${API_URL}/v1/pronunciation/assess`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
        setResult(body);
      } else {
        const body = await apiFetch<AssessResult>('/v1/pronunciation/assess', {
          token,
          method: 'POST',
          body: JSON.stringify({ reference, hypothesis, language }),
        });
        setResult(body);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assess failed');
    } finally {
      setLoading(false);
    }
  }

  async function onPhonemes() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{ words: Array<{ word: string; phonemes: string[]; stress: { notation: string } }> }>(
        '/v1/pronunciation/phonemes',
        {
          token,
          method: 'POST',
          body: JSON.stringify({ text: reference, language }),
        },
      );
      setPhonemes(
        body.words.map((w) => `${w.word}: ${w.phonemes.join(' ')} · ${w.stress.notation}`).join('\n'),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phonemes failed');
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
        Pronunciation Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Assess spoken or typed delivery against a reference phrase. Word alignment, fluency proxies,
        and coaching tips — not ELSA or forced-alignment phonemes.{' '}
        <Link href="/speech">Speech Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Last {analytics.windowDays}d: {analytics.total} actions
          {analytics.averageOverall != null ? ` · avg score ${analytics.averageOverall}` : ''}
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Assess</h2>
          <form onSubmit={(e) => void onAssess(e)} style={{ display: 'grid', gap: '0.65rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Language
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ ...input, display: 'block', marginTop: '0.25rem', width: '6rem' }}
              />
            </label>
            <label style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Reference
              <textarea
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                rows={3}
                style={{ ...input, display: 'block', marginTop: '0.25rem', width: '100%', resize: 'vertical' }}
              />
            </label>
            <label style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Hypothesis (optional if uploading audio)
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={2}
                style={{ ...input, display: 'block', marginTop: '0.25rem', width: '100%', resize: 'vertical' }}
              />
            </label>
            <input
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={loading || !reference.trim()} style={primary}>
                Assess pronunciation
              </button>
              <button type="button" disabled={loading || !reference.trim()} style={secondary} onClick={() => void onPhonemes()}>
                Phonemes / stress
              </button>
            </div>
          </form>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Scores</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Overall {result.scores.overall} · accuracy {result.scores.accuracy} · fluency{' '}
              {result.scores.fluency} · stress {result.scores.stress}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Hypothesis: {result.hypothesis}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{result.note}</p>
            <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
              {result.coaching.map((t) => (
                <li key={t.id} style={{ borderTop: '1px solid var(--line)', padding: '0.45rem 0' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{t.severity}</span>
                  <div>{t.message}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {phonemes ? (
          <section>
            <h2 style={label}>Phonemes</h2>
            <pre
              style={{
                margin: 0,
                padding: '0.85rem',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '0.45rem',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {phonemes}
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
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>· {c.status}</span>
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

const secondary: React.CSSProperties = {
  ...primary,
  background: 'transparent',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
};

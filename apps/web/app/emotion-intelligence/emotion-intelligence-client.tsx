'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  labels: string[];
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type Analytics = { detects: number; byLabel: Record<string, number>; windowDays: number };
type DetectResult = {
  label: string;
  confidence: number;
  scores: Array<{ label: string; score: number }>;
  audioAdjusted: boolean;
  note: string;
};

export function EmotionIntelligenceClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [text, setText] = useState("I'm so excited and can't wait — this is urgent ASAP!");
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, stats] = await Promise.all([
      apiFetch<Engine>('/v1/emotion/engine', { token }),
      apiFetch<Analytics>('/v1/emotion/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(stats);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function onDetect(e: FormEvent) {
    e.preventDefault;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<DetectResult>('/v1/emotion/detect', {
        token,
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setResult(body);
      await refresh;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detect failed');
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
        Emotion Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Detect happy, sad, angry, fear, neutral, stress, confidence, excitement, and urgency from text
        (or audio→STT). Soft audio proxies only — not trained SER.{' '}
        <Link href="/speech">Speech Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Last {analytics.windowDays}d: {analytics.detects} detects
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Detect</h2>
          <form onSubmit={(e) => void onDetect(e)} style={{ display: 'grid', gap: '0.65rem' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              style={{ ...input, resize: 'vertical' }}
            />
            <button type="submit" disabled={loading || !text.trim} style={primary}>
              Detect emotion
            </button>
          </form>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {result.label} · confidence {result.confidence}
              {result.audioAdjusted ? ' · audio-adjusted' : ''}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {result.note}
            </p>
            <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
              {result.scores.slice(0, 6).map((s) => (
                <li key={s.label} style={{ borderTop: '1px solid var(--line)', padding: '0.35rem 0' }}>
                  {s.label} · {s.score}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {engine ? (
          <section>
            <h2 style={label}>Labels</h2>
            <p style={{ margin: 0 }}>{engine.labels.join(' · ')}</p>
            <h2 style={{ ...label, marginTop: '1.25rem' }}>Engine</h2>
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

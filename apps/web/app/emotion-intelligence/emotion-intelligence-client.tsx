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
  sentimentLabels?: string[];
  toneLabels?: string[];
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type Analytics = { detects: number; byLabel: Record<string, number>; windowDays: number };
type DetectResult = {
  label: string;
  confidence: number;
  scores: Array<{ label: string; score: number }>;
  emotionalState?: { label: string; confidence: number };
  sentiment: {
    label: string;
    score: number;
    confidence: number;
    note: string;
  };
  tone: {
    label: string;
    confidence: number;
    scores: Array<{ label: string; score: number }>;
    note: string;
  };
  audioAdjusted: boolean;
  honesty?: string;
  note: string;
};

export function EmotionIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [text, setText] = useState("I'm so excited and can't wait — this is urgent ASAP!");
  const [result, setResult] = useState<DetectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, stats] = await Promise.all([
      apiFetch<Engine>('/v1/emotion/engine', { token }),
      apiFetch<Analytics>('/v1/emotion/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(stats);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function onDetect(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<DetectResult>('/v1/emotion/detect', {
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
        Detect emotional state, sentiment, and delivery tone from speech text (or audio→STT). Soft
        audio energy proxies only — not trained SER and not NIST emotion science.{' '}
        <Link href="/speech">Speech Cloud</Link> · <Link href="/voice">Agents voice picker</Link> ·{' '}
        <Link href="/emotion-voice">Emotion Voice synthesis</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Last {analytics.windowDays}d: {analytics.detects} detects
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Detect emotional state · sentiment · tone</h2>
          <form onSubmit={(e) => void onDetect(e)} style={{ display: 'grid', gap: '0.65rem' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              style={{ ...input, resize: 'vertical' }}
            />
            <button type="submit" disabled={loading || !text.trim()} style={primary}>
              Detect emotion, sentiment &amp; tone
            </button>
          </form>
        </section>

        {result ? (
          <section>
            <h2 style={label}>Result</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
                gap: '0.75rem',
                marginBottom: '0.85rem',
              }}
            >
              <div style={statBox}>
                <div style={statLabel}>Emotional state</div>
                <div style={statValue}>
                  {result.emotionalState?.label ?? result.label}
                </div>
                <div style={statMeta}>
                  confidence {(result.emotionalState?.confidence ?? result.confidence).toFixed(2)}
                  {result.audioAdjusted ? ' · audio-adjusted' : ''}
                </div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Sentiment</div>
                <div style={statValue}>{result.sentiment.label}</div>
                <div style={statMeta}>
                  score {result.sentiment.score} · confidence {result.sentiment.confidence.toFixed(2)}
                </div>
              </div>
              <div style={statBox}>
                <div style={statLabel}>Tone</div>
                <div style={statValue}>{result.tone.label}</div>
                <div style={statMeta}>confidence {result.tone.confidence.toFixed(2)}</div>
              </div>
            </div>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {result.honesty ?? result.note}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {result.sentiment.note} {result.tone.note}
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
            <p style={{ margin: 0 }}>Emotion: {engine.labels.join(' · ')}</p>
            {engine.sentimentLabels ? (
              <p style={{ margin: '0.35rem 0 0' }}>Sentiment: {engine.sentimentLabels.join(' · ')}</p>
            ) : null}
            {engine.toneLabels ? (
              <p style={{ margin: '0.35rem 0 0' }}>Tone: {engine.toneLabels.join(' · ')}</p>
            ) : null}
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

const statBox: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  padding: '0.75rem 0.85rem',
};

const statLabel: React.CSSProperties = {
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--muted)',
};

const statValue: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
  marginTop: '0.2rem',
  textTransform: 'capitalize',
};

const statMeta: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--muted)',
  marginTop: '0.2rem',
};

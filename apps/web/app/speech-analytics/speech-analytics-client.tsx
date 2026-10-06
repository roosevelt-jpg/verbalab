'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type Overview = {
  periodStart: string;
  periodEnd: string;
  estimatedCostUsd: number;
  usage: {
    stt: { requests: number; seconds: number; minutes: number };
    tts: { requests: number; characters: number };
  };
  productActivity: Array<{ action: string; count: number }>;
  note: string;
};
type Monitoring = {
  estimatedCostUsd: number;
  failedJobsInPeriod: number;
  sttAudioDurationP95: number | null;
  averageSttConfidence: number | null;
  note: string;
};

export function SpeechAnalyticsClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monitoring, setMonitoring] = useState<Monitoring | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, over, mon] = await Promise.all([
      apiFetch<Engine>('/v1/speech-analytics/engine', { token }),
      apiFetch<Overview>('/v1/speech-analytics/overview', { token }),
      apiFetch<Monitoring>('/v1/speech-analytics/monitoring', { token }),
    ]);
    setEngine(eng);
    setOverview(over);
    setMonitoring(mon);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function loadReport {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch('/v1/speech-analytics/report', { token });
      setReport(JSON.stringify(body, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report failed');
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
        Speech Analytics
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Track speech usage, languages, dialects, costs, and accuracy proxies. Not a BI cloud or WER
        lab. Language Analytics stays at <Link href="/analytics">/analytics</Link>.{' '}
        <Link href="/speech">Speech Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {overview ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          STT {overview.usage.stt.requests} req / {overview.usage.stt.minutes} min · TTS{' '}
          {overview.usage.tts.requests} req · est. ${overview.estimatedCostUsd.toFixed(4)}
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        {monitoring ? (
          <section>
            <h2 style={label}>Monitoring</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ borderTop: '1px solid var(--line)', padding: '0.35rem 0' }}>
                Failed jobs (period): {monitoring.failedJobsInPeriod}
              </li>
              <li style={{ borderTop: '1px solid var(--line)', padding: '0.35rem 0' }}>
                STT audio duration p95: {monitoring.sttAudioDurationP95 ?? '—'}s
              </li>
              <li style={{ borderTop: '1px solid var(--line)', padding: '0.35rem 0' }}>
                Avg STT confidence: {monitoring.averageSttConfidence ?? '—'}
              </li>
            </ul>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
              {monitoring.note}
            </p>
          </section>
        ) : null}

        {overview?.productActivity?.length ? (
          <section>
            <h2 style={label}>Product activity</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {overview.productActivity.slice(0, 8).map((a) => (
                <li key={a.action} style={{ borderTop: '1px solid var(--line)', padding: '0.35rem 0' }}>
                  {a.action} · {a.count}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <button type="button" disabled={loading} style={primary} onClick={ => void loadReport}>
            Load enterprise report
          </button>
          {report ? <pre style={pre}>{report}</pre> : null}
        </section>

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

const pre: React.CSSProperties = {
  margin: '0.75rem 0 0',
  padding: '0.85rem',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
  maxHeight: '28rem',
};

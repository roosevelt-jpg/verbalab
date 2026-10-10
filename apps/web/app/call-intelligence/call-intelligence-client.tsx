'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type CallItem = {
  id: string;
  status: string;
  summary: string | null;
  direction: string;
  analysis: { sentiment?: { label: string }; qa?: { score: number } } | null;
  createdAt: string;
};
type Report = {
  totalCalls: number;
  bySentiment: Record<string, number>;
  averageQaScore: number | null;
  complianceFlagCount: number;
  windowDays: number;
};

export function CallIntelligenceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [transcript, setTranscript] = useState(
    'Hello, thanks for calling. I am frustrated about my billing invoice and need a refund. This call is recorded for quality. We will follow up tomorrow.',
  );
  const [detail, setDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, list, rep] = await Promise.all([
      apiFetch<Engine>('/v1/call-intelligence/engine', { token }),
      apiFetch<{ data: CallItem[] }>('/v1/call-intelligence/calls?limit=20', { token }),
      apiFetch<Report>('/v1/call-intelligence/report', { token }),
    ]);
    setEngine(eng);
    setCalls(list.data);
    setReport(rep);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function onIngest(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch('/v1/call-intelligence/calls', {
        token,
        method: 'POST',
        body: JSON.stringify({ transcript, direction: 'inbound', analyze: true }),
      });
      setDetail(JSON.stringify(body, null, 2));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingest failed');
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
        Call Intelligence
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Ingest contact-center calls, transcribe, and score summaries, topics, sentiment, compliance,
        coaching, and QA. Not Gong. Voice FAQ stays at <Link href="/voice">/voice</Link>.{' '}
        <Link href="/speech">Speech Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {report ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          Last {report.windowDays}d: {report.totalCalls} calls · avg QA{' '}
          {report.averageQaScore ?? '—'} · compliance flags {report.complianceFlagCount}
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Ingest transcript</h2>
          <form onSubmit={(e) => void onIngest(e)} style={{ display: 'grid', gap: '0.65rem' }}>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={5}
              style={{ ...input, resize: 'vertical' }}
            />
            <button type="submit" disabled={loading || !transcript.trim()} style={primary}>
              Analyze call
            </button>
          </form>
        </section>

        {detail ? (
          <section>
            <h2 style={label}>Latest result</h2>
            <pre style={pre}>{detail}</pre>
          </section>
        ) : null}

        <section>
          <h2 style={label}>Recent calls</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {calls.map((c) => (
              <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                <strong>{c.status}</strong>{' '}
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  · {c.direction} · {c.analysis?.sentiment?.label ?? '—'} · QA{' '}
                  {c.analysis?.qa?.score ?? '—'}
                </span>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                  {c.summary ?? 'No summary'}
                </div>
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
  margin: 0,
  padding: '0.85rem',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
  maxHeight: '24rem',
};

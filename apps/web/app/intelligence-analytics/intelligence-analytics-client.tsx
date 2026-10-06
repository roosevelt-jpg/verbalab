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
  honesty: {
    regeneratesSpeechAnalytics: boolean;
    biDashboardOs: boolean;
    aggregatesOnly: boolean;
  };
};
type Overview = {
  estimatedCostUsd: number;
  usage: {
    chat: { requests: number; tokens: number };
    embeddings: { requests: number; tokens: number };
  };
  surfaces: Array<{ surface: string; count: number }>;
  quality: {
    avgDecisionConfidence: number | null;
    avgPromptEvalScore: number | null;
  };
  note: string;
};

export function IntelligenceAnalyticsClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ov] = await Promise.all([
      apiFetch<Engine>('/v1/intelligence-analytics/engine', { token }),
      apiFetch<Overview>('/v1/intelligence-analytics/overview', { token }),
    ]);
    setEngine(eng);
    setOverview(ov);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

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
        Intelligence Analytics
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Usage/quality aggregates for Intelligence Cloud — not Language/Speech/Voice analytics.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> ·{' '}
        <Link href="/speech-analytics">Speech Analytics</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {overview ? (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '48rem' }}>
          <section>
            <h2 style={label}>This month</h2>
            <p style={{ margin: 0 }}>
              Chat {overview.usage.chat.requests} req / {overview.usage.chat.tokens} tokens ·
              Embeddings {overview.usage.embeddings.requests} req /{' '}
              {overview.usage.embeddings.tokens} tokens
            </p>
            <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>
              Est. cost ${overview.estimatedCostUsd.toFixed(4)} USD
            </p>
          </section>

          <section>
            <h2 style={label}>Surfaces</h2>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)' }}>
              {overview.surfaces.length === 0 ? (
                <li>No intelligence audits yet</li>
              ) : (
                overview.surfaces.map((s) => (
                  <li key={s.surface}>
                    {s.surface}: {s.count}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 style={label}>Quality proxies</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Avg decision confidence:{' '}
              {overview.quality.avgDecisionConfidence ?? 'n/a'} · Avg prompt eval:{' '}
              {overview.quality.avgPromptEvalScore ?? 'n/a'}
            </p>
          </section>
        </div>
      ) : null}

      {engine ? (
        <section style={{ marginTop: '1.75rem', maxWidth: '48rem' }}>
          <h2 style={label}>Capabilities</h2>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id}>
                {c.name}
              </li>
            ))}
          </ul>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
            regeneratesSpeechAnalytics={String(engine.honesty.regeneratesSpeechAnalytics)} ·
            biDashboardOs={String(engine.honesty.biDashboardOs)} · aggregatesOnly=
            {String(engine.honesty.aggregatesOnly)}
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

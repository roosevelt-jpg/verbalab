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
    regeneratesIntelligenceAnalytics: boolean;
    biDashboardOs: boolean;
    aggregatesOnly: boolean;
    orgWorkspaceScoped: boolean;
  };
};

type Overview = {
  growth: {
    documents: number;
    chunks: number;
    documentsCreatedInPeriod: number;
  };
  usage: {
    totalEvents: number;
    bySurface: Array<{ surface: string; count: number }>;
  };
  quality: {
    readyRate: number | null;
    avgChunksPerDoc: number | null;
    failed: number;
  };
  search: {
    searches: number;
    zeroHitRate: number | null;
    avgHits: number | null;
  };
  gaps: {
    unchunkedReady: number;
    failedDocs: number;
    zeroHitSearches: number;
    unassignedDocs: number;
  };
  confidence: { avgScore: number | null; samples: number };
  note: string;
};

export function KnowledgeAnalyticsClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, ov] = await Promise.all([
      apiFetch<Engine>('/v1/knowledge-analytics/engine', { token }),
      apiFetch<Overview>('/v1/knowledge-analytics/overview', { token }),
    ]);
    setEngine(eng);
    setOverview(ov);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void refresh.catch((err: Error) => setError(err.message));
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
        Knowledge Analytics
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Growth, usage, quality, search success, gaps, and confidence for Knowledge Cloud — not
        Language/Speech/Voice/Intelligence analytics.{' '}
        <Link href="/knowledge-cloud">Knowledge Cloud</Link> ·{' '}
        <Link href="/intelligence-analytics">Intel Analytics</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {overview ? (
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '48rem' }}>
          <section>
            <h2 style={label}>Growth</h2>
            <p style={{ margin: 0 }}>
              {overview.growth.documents} docs · {overview.growth.chunks} chunks ·{' '}
              {overview.growth.documentsCreatedInPeriod} created this period
            </p>
          </section>

          <section>
            <h2 style={label}>Usage</h2>
            <p style={{ margin: '0 0 0.35rem' }}>{overview.usage.totalEvents} audit events</p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)' }}>
              {overview.usage.bySurface.length === 0 ? (
                <li>No knowledge audits yet</li>
              ) : (
                overview.usage.bySurface.map((s) => (
                  <li key={s.surface}>
                    {s.surface}: {s.count}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 style={label}>Quality · Search · Gaps</h2>
            <p style={{ margin: 0 }}>
              Ready rate {overview.quality.readyRate ?? '—'} · avg chunks{' '}
              {overview.quality.avgChunksPerDoc ?? '—'} · failed {overview.quality.failed}
            </p>
            <p style={{ margin: '0.35rem 0 0' }}>
              Searches {overview.search.searches} · zero-hit rate{' '}
              {overview.search.zeroHitRate ?? '—'} · avg hits {overview.search.avgHits ?? '—'}
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>
              Gaps: unchunked {overview.gaps.unchunkedReady} · failed {overview.gaps.failedDocs} ·
              zero-hit {overview.gaps.zeroHitSearches} · unassigned {overview.gaps.unassignedDocs}
            </p>
            <p style={{ margin: '0.35rem 0 0' }}>
              Avg confidence {overview.confidence.avgScore ?? '—'} ({overview.confidence.samples}{' '}
              docs)
            </p>
          </section>
        </div>
      ) : null}

      {engine ? (
        <section style={{ marginTop: '2rem', maxWidth: '48rem' }}>
          <h2 style={label}>Capabilities</h2>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> ({c.status}) — {c.notes}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Honesty: biDashboardOs={String(engine.honesty.biDashboardOs)} ·
            regeneratesIntelligenceAnalytics=
            {String(engine.honesty.regeneratesIntelligenceAnalytics)} · aggregatesOnly=
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
  margin: '0 0 0.4rem',
};

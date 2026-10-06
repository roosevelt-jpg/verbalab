'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import {
  BarChart,
  LineChart,
  ProgressRing,
  seedUsageSeries,
} from '@/components/stats/stat-charts';
import {
  ActivityBoard,
  HeatList,
  PipelineStrip,
  StatusRing,
  UsageMeter,
  LivePulse,
} from '@/components/stats/activity-visuals';
import '@/components/stats/stat-charts.css';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};
type Overview = {
  periodStart: string;
  periodEnd: string;
  estimatedCostUsd: number;
  revenueCents: number;
  usage: {
    tts: { requests: number; characters: number };
    voiceAudits: { total: number };
  };
  topVoices: Array<{ voice: string; count: number }>;
  note: string;
};
type Monitoring = {
  ttsRequests: number;
  estimatedCostUsd: number;
  revenueCents: number;
  latencyMsP95: number | null;
  watermarkRate: number | null;
  streamEvents: number;
  note: string;
};

export function VoiceAnalyticsClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monitoring, setMonitoring] = useState<Monitoring | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, over, mon] = await Promise.all([
      apiFetch<Engine>('/v1/voice-analytics/engine', { token }),
      apiFetch<Overview>('/v1/voice-analytics/overview', { token }),
      apiFetch<Monitoring>('/v1/voice-analytics/monitoring', { token }),
    ]);
    setEngine(eng);
    setOverview(over);
    setMonitoring(mon);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch('/v1/voice-analytics/report', { token });
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
        Voice Analytics
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Track voice usage, voices, marketplace revenue, and quality proxies. Not a BI cloud. Speech
        Analytics stays at <Link href="/speech-analytics">/speech-analytics</Link>.{' '}
        <Link href="/voice-cloud">Voice Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <LivePulse label={overview ? 'Voice metrics' : 'Connecting'} />
      </div>

      {overview ? (
        <ActivityBoard kicker="Voice analytics hub" title="Speech activity">
          <PipelineStrip
            title="Voice path"
            stages={[
              {
                id: 'tts',
                label: 'TTS',
                state: overview.usage.tts.requests > 0 ? 'active' : 'idle',
              },
              {
                id: 'wm',
                label: 'Watermark',
                state: monitoring?.watermarkRate != null ? 'ready' : 'idle',
              },
              {
                id: 'stream',
                label: 'Stream',
                state: (monitoring?.streamEvents ?? 0) > 0 ? 'ready' : 'idle',
              },
              {
                id: 'bill',
                label: 'Meter',
                state: overview.estimatedCostUsd > 0 ? 'ready' : 'idle',
              },
            ]}
          />
          <div className="lg-studio-overview">
            <UsageMeter
              label="TTS characters"
              value={overview.usage.tts.characters}
              max={Math.max(overview.usage.tts.characters, 1000)}
              unit="chars"
            />
            <UsageMeter
              label="TTS requests"
              value={overview.usage.tts.requests}
              max={Math.max(overview.usage.tts.requests, 50)}
              unit="req"
            />
            <StatusRing
              status={(monitoring?.latencyMsP95 ?? 9999) < 800 ? 'ok' : monitoring ? 'warn' : 'idle'}
              label="Latency p95"
              detail={
                monitoring?.latencyMsP95 != null ? `${monitoring.latencyMsP95} ms` : 'No samples'
              }
            />
            <ProgressRing
              value={Math.round((monitoring?.watermarkRate ?? 0) * 100)}
              max={100}
              label="Watermark rate"
              sublabel={`Revenue $${(overview.revenueCents / 100).toFixed(2)}`}
            />
          </div>
          <div className="lg-stats-grid">
            <LineChart
              title="TTS volume trend"
              series={seedUsageSeries(overview.usage.tts.characters, overview.usage.tts.requests)}
            />
            <BarChart
              title="Top voices"
              bars={
                overview.topVoices.length
                  ? overview.topVoices.slice(0, 6).map((v) => ({
                      label: v.voice.slice(0, 12),
                      value: v.count,
                    }))
                  : [{ label: 'idle', value: 0 }]
              }
            />
            <HeatList
              title="Voice heat"
              empty="No voice usage yet"
              items={overview.topVoices.slice(0, 8).map((v) => ({
                id: v.voice,
                label: v.voice,
                value: v.count,
                hint: 'plays',
              }))}
            />
          </div>
          {monitoring?.note ? (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{monitoring.note}</p>
          ) : null}
        </ActivityBoard>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem', marginTop: '1.25rem' }}>

        <section>
          <button type="button" disabled={loading} style={primary} onClick={() => void loadReport()}>
            Load enterprise report
          </button>
          {report ? <pre style={pre}>{report}</pre> : null}
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Engine</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note}
            </p>
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

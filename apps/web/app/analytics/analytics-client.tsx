'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import {
  BarChart,
  DualLineChart,
  LineChart,
  MetricCard,
  ProgressRing,
  seedRequestSeries,
  seedUsageSeries,
} from '@/components/stats/stat-charts';
import {
  ActivityBoard,
  HeatList,
  LivePulse,
  PipelineStrip,
  StatusRing,
  UsageMeter,
} from '@/components/stats/activity-visuals';
import '@/components/stats/stat-charts.css';

type Catalog = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; api: string | null }>;
};

type Overview = {
  periodStart: string;
  periodEnd: string;
  byFeature: Array<{
    feature: string;
    requests: number;
    units: number;
    unitType: string;
    estimatedCostUsd: number;
  }>;
  byLanguagePair: Array<{
    source: string;
    target: string;
    requests: number;
    characters: number;
  }>;
  cost: { estimatedUsd: number; currency: string; note: string };
  errors: {
    jobSucceeded: number;
    jobFailed: number;
    jobTotal: number;
    errorRate: number;
  };
};

type Quality = {
  averageQualityScore: number | null;
  translationAccuracyProxy: number | null;
  reviews: number;
  accepted: number;
  rejected: number;
  note: string;
};

type Latency = {
  samples: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  avgMs: number | null;
};

type Dialects = {
  dialectDetects: number;
  accentDetects: number;
  byDialect: Array<{ code: string; count: number }>;
};

export function AnalyticsClient() {
  const { getToken, isLoaded } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [latency, setLatency] = useState<Latency | null>(null);
  const [dialects, setDialects] = useState<Dialects | null>(null);
  const [reportNote, setReportNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (token: string) => {
    const [cat, overview, q, lat, dia] = await Promise.all([
      apiFetch<Catalog>('/v1/analytics'),
      apiFetch<Overview>('/v1/analytics/overview', { token }),
      apiFetch<Quality>('/v1/analytics/quality', { token }),
      apiFetch<Latency>('/v1/analytics/latency', { token }),
      apiFetch<Dialects>('/v1/analytics/dialects', { token }),
    ]);
    setCatalog(cat);
    setData(overview);
    setQuality(q);
    setLatency(lat);
    setDialects(dia);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Not signed in');
        await load(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    })();
  }, [getToken, isLoaded, load]);

  async function loadEnterpriseReport() {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const report = await apiFetch<{ note: string; generatedAt: string }>(
        '/v1/analytics/reports/enterprise',
        { token },
      );
      setReportNote(`Report generated ${new Date(report.generatedAt).toUTCString()}. ${report.note}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report failed');
    }
  }

  const totalRequests = data?.byFeature.reduce((s, r) => s + r.requests, 0) ?? 0;

  return (
    <AppShell>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p className="lg-workspace-kicker">Translate analytics hub</p>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
              fontSize: '2rem',
              color: 'var(--brand-navy)',
            }}
          >
            Language Analytics
          </h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', maxWidth: '42rem' }}>
            {catalog?.note ??
              'Volume, quality, latency, and estimated cost from your database — not an analytics cloud.'}
          </p>
        </div>
        <LivePulse label={data ? 'Streaming metrics' : 'Connecting'} />
      </header>
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      <div style={{ marginTop: '1rem' }}>
        <button type="button" className="vl-btn" onClick={() => void loadEnterpriseReport()}>
          Generate enterprise report
        </button>
        {reportNote ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.5rem' }}>{reportNote}</p>
        ) : null}
      </div>

      {data ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem', maxWidth: '56rem' }}>
          <ActivityBoard kicker="Job pipeline" title="Translate & speech activity">
            <PipelineStrip
              title="Request path"
              stages={[
                { id: 'accept', label: 'Accept', state: totalRequests > 0 ? 'ready' : 'idle' },
                { id: 'mt', label: 'Baobab MT', state: totalRequests > 0 ? 'active' : 'ready' },
                {
                  id: 'quality',
                  label: 'Quality',
                  state: (quality?.reviews ?? 0) > 0 ? 'ready' : 'idle',
                },
                {
                  id: 'bill',
                  label: 'Meter',
                  state: data.cost.estimatedUsd > 0 ? 'ready' : 'idle',
                },
              ]}
            />
            <div className="lg-studio-overview">
              <StatusRing
                status={data.errors.errorRate < 0.05 ? 'ok' : data.errors.errorRate < 0.2 ? 'warn' : 'bad'}
                label="Job health"
                detail={`${((1 - data.errors.errorRate) * 100).toFixed(1)}% success`}
              />
              <UsageMeter
                label="Period volume"
                value={totalRequests}
                max={Math.max(totalRequests, 100)}
                unit="requests"
              />
              <HeatList
                title="Locale pair heat"
                empty="No translation pairs in this period"
                items={data.byLanguagePair.slice(0, 8).map((r) => ({
                  id: `${r.source}-${r.target}`,
                  label: `${r.source} → ${r.target}`,
                  value: r.characters || r.requests,
                  hint: `${r.requests} req`,
                }))}
              />
            </div>
          </ActivityBoard>
          <div className="lg-stats-grid">
            <ProgressRing
              value={Math.round((1 - data.errors.errorRate) * 100)}
              max={100}
              label="Success rate"
              sublabel={`${data.errors.jobFailed} failed · ${data.errors.jobTotal} jobs`}
            />
            <ProgressRing
              value={quality?.translationAccuracyProxy != null ? Math.round(quality.translationAccuracyProxy * 100) : 0}
              max={100}
              label="Quality proxy"
              sublabel={
                quality?.averageQualityScore != null
                  ? `Avg score ${quality.averageQualityScore} · ${quality.reviews} reviews`
                  : 'No reviews yet'
              }
            />
            <LineChart
              title="Request timeline"
              series={seedRequestSeries(data.byFeature.reduce((s, r) => s + r.requests, 0) || 1)}
              color="#007C78"
            />
            <DualLineChart
              title="Volume vs estimated cost"
              seriesA={seedUsageSeries(
                data.byFeature.reduce((s, r) => s + r.units, 0) || 1,
                data.byFeature.reduce((s, r) => s + r.requests, 0) || 1,
              )}
              seriesB={seedRequestSeries(Math.max(1, Math.round(data.cost.estimatedUsd * 10_000)))}
              labelA="Units"
              labelB="Cost (scaled)"
            />
          </div>

          <BarChart
            title="Requests by feature"
            bars={
              data.byFeature.length > 0
                ? data.byFeature.map((r) => ({ label: r.feature.slice(0, 10), value: r.requests }))
                : [{ label: 'idle', value: 0 }]
            }
          />

          {data.byLanguagePair.length > 0 ? (
            <BarChart
              title="Top language pairs"
              bars={data.byLanguagePair.slice(0, 6).map((r) => ({
                label: `${r.source}→${r.target}`,
                value: r.characters || r.requests,
              }))}
            />
          ) : null}

          <div className="lg-stats-grid">
            <MetricCard label="Estimated cost (USD)" value={`$${data.cost.estimatedUsd.toFixed(4)}`} />
            <MetricCard
              label="Job error rate"
              value={`${(data.errors.errorRate * 100).toFixed(2)}%`}
              hint={`${data.errors.jobFailed} failed / ${data.errors.jobTotal} jobs`}
            />
            <MetricCard
              label="Avg quality score"
              value={quality?.averageQualityScore != null ? String(quality.averageQualityScore) : '—'}
              hint={
                quality
                  ? `${quality.reviews} reviews · accuracy proxy ${
                      quality.translationAccuracyProxy != null
                        ? `${(quality.translationAccuracyProxy * 100).toFixed(1)}%`
                        : '—'
                    }`
                  : undefined
              }
            />
            <MetricCard
              label="Translate p95 latency"
              value={latency?.p95Ms != null ? `${latency.p95Ms} ms` : '—'}
              hint={latency ? `${latency.samples} samples · p50 ${latency.p50Ms ?? '—'} ms` : undefined}
            />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{data.cost.note}</p>
          {quality ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>{quality.note}</p>
          ) : null}

          {dialects && dialects.dialectDetects + dialects.accentDetects > 0 ? (
            <section>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Dialect / accent detects</h2>
              <BarChart
                title="Dialect volume"
                bars={dialects.byDialect.slice(0, 8).map((d) => ({ label: d.code, value: d.count }))}
              />
            </section>
          ) : null}

          <section>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>By feature</h2>
            {data.byFeature.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No usage events in this period.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '0.4rem 0' }}>Feature</th>
                    <th>Requests</th>
                    <th>Units</th>
                    <th>Est. USD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byFeature.map((row) => (
                    <tr key={`${row.feature}-${row.unitType}`}>
                      <td style={{ padding: '0.45rem 0' }}>{row.feature}</td>
                      <td>{row.requests}</td>
                      <td>
                        {row.units} {row.unitType}
                      </td>
                      <td>${row.estimatedCostUsd.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem' }}>Language pairs (translate)</h2>
            {data.byLanguagePair.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No translation requests in this period.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '0.4rem 0' }}>Pair</th>
                    <th>Requests</th>
                    <th>Characters</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byLanguagePair.map((row) => (
                    <tr key={`${row.source}-${row.target}`}>
                      <td style={{ padding: '0.45rem 0' }}>
                        {row.source} → {row.target}
                      </td>
                      <td>{row.requests}</td>
                      <td>{row.characters}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Period: {new Date(data.periodStart).toUTCString()} → {new Date(data.periodEnd).toUTCString()}
          </p>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}

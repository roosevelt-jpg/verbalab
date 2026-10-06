'use client';

import { useEffect, useState } from 'react';
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
import '@/components/stats/stat-charts.css';

type Summary = {
  periodStart: string;
  requests: number;
  characters: number;
  translate?: { requests: number; characters: number };
  stt?: { requests: number; seconds: number; minutes: number };
  tts?: { requests: number; characters: number };
  ocr?: { requests: number; pages: number };
  chat?: { requests: number; tokens: number };
  embeddings?: { requests: number; tokens: number };
};

type BillingLite = {
  characterQuota: number;
  charactersUsed: number;
  charactersRemaining: number;
  planName: string;
};

export function UsageClient() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [billing, setBilling] = useState<BillingLite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Not signed in');
        const [data, bill] = await Promise.all([
          apiFetch<Summary>('/v1/usage/summary', { token }),
          apiFetch<BillingLite>('/v1/billing/summary', { token }).catch(() => null),
        ]);
        setSummary(data);
        setBilling(bill);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage');
      }
    })();
  }, [getToken, isLoaded]);

  const translateChars = summary?.translate?.characters ?? summary?.characters ?? 0;
  const translateReqs = summary?.translate?.requests ?? summary?.requests ?? 0;
  const ttsChars = summary?.tts?.characters ?? 0;
  const sttMins = summary?.stt?.minutes ?? 0;
  const totalActivity =
    translateReqs +
    (summary?.stt?.requests ?? 0) +
    (summary?.tts?.requests ?? 0) +
    (summary?.ocr?.requests ?? 0) +
    (summary?.chat?.requests ?? 0) +
    (summary?.embeddings?.requests ?? 0);

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Usage
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Month-to-date translation, speech, OCR, and chat usage — with timelines and balance for your workspace.
      </p>
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {summary ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem' }}>
          <div className="lg-stats-grid">
            {billing ? (
              <ProgressRing
                value={billing.charactersUsed}
                max={Math.max(billing.characterQuota, 1)}
                label={`${billing.planName} balance`}
                sublabel={`${billing.charactersRemaining.toLocaleString()} characters left`}
              />
            ) : (
              <ProgressRing
                value={translateChars}
                max={Math.max(translateChars * 2, 50_000)}
                label="Character volume"
                sublabel={`${translateChars.toLocaleString()} translate chars`}
              />
            )}
            <ProgressRing
              value={Math.min(totalActivity, 500)}
              max={500}
              label="Request pace"
              sublabel={`${totalActivity.toLocaleString()} calls this period`}
            />
            <LineChart
              title="Character timeline"
              series={seedUsageSeries(translateChars + ttsChars, translateReqs)}
              unitLabel="chars"
            />
            <DualLineChart
              title="Requests vs characters"
              seriesA={seedRequestSeries(translateReqs + (summary.tts?.requests ?? 0))}
              seriesB={seedUsageSeries(translateChars + ttsChars, translateReqs).map((v) => Math.round(v / 40))}
              labelA="Requests"
              labelB="Chars (scaled)"
            />
          </div>

          <BarChart
            title="Usage by product"
            bars={[
              { label: 'Translate', value: translateReqs },
              { label: 'TTS', value: summary.tts?.requests ?? 0 },
              { label: 'STT', value: summary.stt?.requests ?? 0 },
              { label: 'OCR', value: summary.ocr?.requests ?? 0 },
              { label: 'Chat', value: summary.chat?.requests ?? 0 },
              { label: 'Embed', value: summary.embeddings?.requests ?? 0 },
            ]}
          />

          <div className="lg-stats-grid">
            <MetricCard label="Translate requests" value={String(translateReqs)} />
            <MetricCard label="Translate characters" value={translateChars.toLocaleString()} />
            <MetricCard label="STT minutes" value={String(sttMins)} hint={`${summary.stt?.requests ?? 0} requests`} />
            <MetricCard
              label="TTS characters"
              value={ttsChars.toLocaleString()}
              hint={`${summary.tts?.requests ?? 0} requests`}
            />
            <MetricCard
              label="OCR pages"
              value={String(summary.ocr?.pages ?? 0)}
              hint={`${summary.ocr?.requests ?? 0} requests`}
            />
            <MetricCard
              label="Chat tokens"
              value={(summary.chat?.tokens ?? 0).toLocaleString()}
              hint={`${summary.chat?.requests ?? 0} requests`}
            />
            <MetricCard
              label="Embeddings tokens"
              value={(summary.embeddings?.tokens ?? 0).toLocaleString()}
              hint={`${summary.embeddings?.requests ?? 0} requests`}
            />
          </div>

          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Period start: {new Date(summary.periodStart).toUTCString()}
          </p>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}

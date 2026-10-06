'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Product = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

type Overview = {
  usage: {
    periodStart: string;
    chat: { requests: number; tokens: number };
    embeddings: { requests: number; tokens: number };
  };
  products: Product[];
  architecture: {
    graphql: boolean;
    cqrs: boolean;
    terraform: boolean;
    kubernetes: boolean;
    gpuHyperscalerOs: boolean;
    multiRegionRuntimeOs: boolean;
    regeneratesAiGateway: boolean;
    extendsAiGateway: boolean;
    hardSpendCeilingsRequired: boolean;
    openEndedGpuAutoscale: boolean;
  };
  deferred: Record<string, boolean>;
  spendSafety: {
    hardSpendCeilingsRequired: boolean;
    openEndedGpuAutoscale: boolean;
    sandboxBeforeRealCloudBill: boolean;
    note: string;
  };
  links: Record<string, string>;
  note: string;
};

export function InferenceCloudClient {
  const { getToken, isLoaded } = useAuth;
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/inference-cloud/overview', { token }));
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

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
        Inference Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Shared model runtime hub over the AI Gateway and vendor APIs. Extends Volumes 1–6 — does not
        invent a GPU hyperscaler.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Chat {data.usage.chat.requests} req / {data.usage.chat.tokens} tokens · Embeddings{' '}
            {data.usage.embeddings.requests} req
          </p>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>

          <section
            style={{
              borderLeft: '3px solid #b45309',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Spend safety</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>
              {data.spendSafety.note}
            </p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
              hardSpendCeilingsRequired={String(data.architecture.hardSpendCeilingsRequired)} ·
              openEndedGpuAutoscale={String(data.architecture.openEndedGpuAutoscale)}
            </p>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.gateway ?? '/gateway'} style={secondary}>
                Gateway
              </Link>
              <Link href={data.links.modelServing ?? '/model-serving'} style={secondary}>
                Model Serving
              </Link>
              <Link href={data.links.aiRouter ?? '/ai-router'} style={secondary}>
                AI Router
              </Link>
              <Link href={data.links.streamingRuntime ?? '/streaming-runtime'} style={secondary}>
                Streaming
              </Link>
              <Link href={data.links.batchRuntime ?? '/batch-runtime'} style={secondary}>
                Batch
              </Link>
              <Link href={data.links.intelligentCache ?? '/intelligent-cache'} style={secondary}>
                Cache
              </Link>
              <Link href={data.links.costOptimization ?? '/cost-optimization'} style={secondary}>
                Cost
              </Link>
              <Link
                href={data.links.aiRuntimeAnalytics ?? '/ai-runtime-analytics'}
                style={secondary}
              >
                Runtime Analytics
              </Link>
              <Link href={data.links.models ?? '/models'} style={secondary}>
                Models
              </Link>
              <Link href={data.links.chat ?? '/chat'} style={secondary}>
                Chat
              </Link>
              <Link href={data.links.aiOrchestration ?? '/ai-orchestration'} style={secondary}>
                Orchestration
              </Link>
              <Link href={data.links.intelligenceCloud ?? '/intelligence-cloud'} style={secondary}>
                Intelligence
              </Link>
              <Link href={data.links.knowledgeCloud ?? '/knowledge-cloud'} style={secondary}>
                Knowledge
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Products</h2>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {data.products.map((p) => (
                <li key={p.id} style={{ marginBottom: '0.55rem' }}>
                  <strong>{p.name}</strong> ({p.status})
                  {p.console ? (
                    <>
                      {' '}
                      · <Link href={p.console}>{p.console}</Link>
                    </>
                  ) : null}
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{p.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
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

const secondary: React.CSSProperties = {
  color: 'var(--foreground)',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
};

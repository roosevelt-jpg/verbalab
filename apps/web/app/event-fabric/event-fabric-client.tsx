'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

type Broker = {
  id: string;
  name: string;
  status: string;
  protocol: string;
  notes: string;
};

type Overview = {
  products: Capability[];
  brokers: Broker[];
  backend: string;
  architecture: {
    customerFacingProduct: boolean;
    kafkaHyperscalerOs: boolean;
    redisStreamsActive: boolean;
    regeneratesVolumes1to9: boolean;
  };
  safety: {
    fabricWidePolicyHardGateRequired: boolean;
    policyLogOnlyForbidden: boolean;
    note: string;
  };
  analytics: {
    published: number;
    consumed: number;
    failed: number;
    dlq: number;
    retried: number;
  };
  links: Record<string, string>;
  note: string;
};

export function EventFabricClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/event-fabric/overview', { token }));
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
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
        Event Fabric
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Internal CloudEvents bus over Redis Streams — Kafka/NATS/RabbitMQ adapters deferred. Not a
        broker hyperscaler OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>

          <section>
            <h2 style={label}>Active backend</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>{data.backend}</p>
          </section>

          <section
            style={{
              borderLeft: '3px solid #b45309',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Policy safety</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>{data.safety.note}</p>
          </section>

          <section>
            <h2 style={label}>Analytics</h2>
            <ul style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>published: {data.analytics.published}</li>
              <li>consumed: {data.analytics.consumed}</li>
              <li>failed: {data.analytics.failed}</li>
              <li>dlq: {data.analytics.dlq}</li>
              <li>retried: {data.analytics.retried}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.aiFabric ?? '/ai-fabric'} style={secondary}>
                AI Fabric
              </Link>
              <Link href={data.links.streamingRuntime ?? '/streaming-runtime'} style={secondary}>
                Streaming Runtime
              </Link>
              <Link href={data.links.policyRuntime ?? '/policy-runtime'} style={secondary}>
                Policy Runtime
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Brokers</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {data.brokers.map((b) => (
                <li key={b.id}>
                  <strong>{b.name}</strong> ({b.status} / {b.protocol}) — {b.notes}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {data.products.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong> ({p.status}) — {p.notes}
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
  margin: '0 0 0.5rem',
  color: 'var(--muted)',
};

const secondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.7rem',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 4,
  textDecoration: 'none',
  color: 'inherit',
  fontSize: '0.9rem',
};

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

type Route = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

type Overview = {
  products: Capability[];
  routes: Route[];
  architecture: {
    customerFacingProduct: boolean;
    infiniteContextWindow: boolean;
    websocketOs: boolean;
    regeneratesContextRuntime: boolean;
  };
  safety: {
    fabricWidePolicyHardGateRequired: boolean;
    policyLogOnlyForbidden: boolean;
    note: string;
  };
  counters: {
    routePlans: number;
    propagations: number;
    eventPublishes: number;
  };
  links: Record<string, string>;
  note: string;
};

export function ContextFabricClient {
  const { getToken, isLoaded } = useAuth;
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/context-fabric/overview', { token }));
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
        Context Fabric
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Cross-cloud context router over Context Runtime — not an infinite context window or WebSocket
        OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>

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
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>infiniteContextWindow: {String(data.architecture.infiniteContextWindow)}</li>
              <li>websocketOs: {String(data.architecture.websocketOs)}</li>
              <li>
                regeneratesContextRuntime: {String(data.architecture.regeneratesContextRuntime)}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Counters</h2>
            <ul style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>routePlans: {data.counters.routePlans}</li>
              <li>propagations: {data.counters.propagations}</li>
              <li>eventPublishes: {data.counters.eventPublishes}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.contextRuntime ?? '/context-runtime'} style={secondary}>
                Context Runtime
              </Link>
              <Link href={data.links.eventFabric ?? '/event-fabric'} style={secondary}>
                Event Fabric
              </Link>
              <Link href={data.links.aiFabric ?? '/ai-fabric'} style={secondary}>
                AI Fabric
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Routes</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {data.routes.map((r) => (
                <li key={r.kind}>
                  <strong>{r.name}</strong> → {r.target} ({r.cloud}) — {r.notes}
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

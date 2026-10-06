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

type Pipeline = {
  id: string;
  name: string;
  steps: string[];
  notes: string;
};

type Overview = {
  products: Capability[];
  routes: Route[];
  pipelines: Pipeline[];
  architecture: {
    customerFacingProduct: boolean;
    hardGate: boolean;
    logOnlyMode: boolean;
    opaCedarOs: boolean;
    regeneratesPolicyRuntime: boolean;
  };
  safety: {
    hardGate: boolean;
    logOnlyMode: boolean;
    fabricWidePolicyHardGateRequired: boolean;
    policyLogOnlyForbidden: boolean;
    note: string;
  };
  links: Record<string, string>;
  note: string;
};

export function PolicyFabricClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/policy-fabric/overview', { token }));
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
        Policy Fabric
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Fabric-wide hard gate over Policy Runtime — denies return 403, never log-only.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>

          <section
            style={{
              borderLeft: '3px solid #991b1b',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Hard gate</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>{data.safety.note}</p>
          </section>

          <section>
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>hardGate: {String(data.architecture.hardGate)}</li>
              <li>logOnlyMode: {String(data.architecture.logOnlyMode)}</li>
              <li>opaCedarOs: {String(data.architecture.opaCedarOs)}</li>
              <li>
                regeneratesPolicyRuntime:{' '}
                {String(data.architecture.regeneratesPolicyRuntime)}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.policyRuntime ?? '/policy-runtime'} style={secondary}>
                Policy Runtime
              </Link>
              <Link href={data.links.agentFabric ?? '/agent-fabric'} style={secondary}>
                Agent Fabric
              </Link>
              <Link href={data.links.aiFabric ?? '/ai-fabric'} style={secondary}>
                AI Fabric
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Pipelines</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {data.pipelines.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong> [{p.steps.join(' → ')}] — {p.notes}
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

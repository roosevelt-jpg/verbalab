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
    langGraphOs: boolean;
    autoGptOs: boolean;
    sandboxed: boolean;
    regeneratesAgentRuntime: boolean;
  };
  safety: {
    sandboxed: boolean;
    policyRuntimeHardGate: boolean;
    openToolExecution: boolean;
    fabricWidePolicyHardGateRequired: boolean;
    policyLogOnlyForbidden: boolean;
    note: string;
  };
  links: Record<string, string>;
  note: string;
};

export function AgentFabricClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/agent-fabric/overview', { token }));
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
        Agent Fabric
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Cross-cloud agent router over Agent Runtime — sandboxed and Policy-gated, not open agent-orchestration OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>

          <section
            style={{
              borderLeft: '3px solid #b91c1c',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Policy safety</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>{data.safety.note}</p>
          </section>

          <section>
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>sandboxed: {String(data.architecture.sandboxed)}</li>
              <li>langGraphOs: {String(data.architecture.langGraphOs)}</li>
              <li>autoGptOs: {String(data.architecture.autoGptOs)}</li>
              <li>openToolExecution: {String(data.safety.openToolExecution)}</li>
              <li>
                regeneratesAgentRuntime:{' '}
                {String(data.architecture.regeneratesAgentRuntime)}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.agentRuntime ?? '/agent-runtime'} style={secondary}>
                Agent Runtime
              </Link>
              <Link href={data.links.policyRuntime ?? '/policy-runtime'} style={secondary}>
                Policy Runtime
              </Link>
              <Link href={data.links.memoryFabric ?? '/memory-fabric'} style={secondary}>
                Memory Fabric
              </Link>
              <Link href={data.links.marketplace ?? '/marketplace'} style={secondary}>
                Marketplace
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

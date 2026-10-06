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
    confluenceSharepointOs: boolean;
    neo4jFederationOs: boolean;
    regeneratesKnowledgeCloud: boolean;
  };
  safety: {
    fabricWidePolicyHardGateRequired: boolean;
    policyLogOnlyForbidden: boolean;
    note: string;
  };
  counters: {
    routePlans: number;
    distributions: number;
    syncs: number;
    federations: number;
    eventPublishes: number;
  };
  workspace: { knowledgeDocuments: number; peerWorkspaces: number };
  links: Record<string, string>;
  note: string;
};

export function KnowledgeFabricClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/knowledge-fabric/overview', { token }));
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
        Knowledge Fabric
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Cross-cloud knowledge router over Knowledge Cloud — not Confluence/Neo4j federation OS.
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
              <li>confluenceSharepointOs: {String(data.architecture.confluenceSharepointOs)}</li>
              <li>neo4jFederationOs: {String(data.architecture.neo4jFederationOs)}</li>
              <li>
                regeneratesKnowledgeCloud: {String(data.architecture.regeneratesKnowledgeCloud)}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Workspace</h2>
            <ul style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>knowledgeDocuments: {data.workspace.knowledgeDocuments}</li>
              <li>peerWorkspaces: {data.workspace.peerWorkspaces}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.knowledgeCloud ?? '/knowledge-cloud'} style={secondary}>
                Knowledge Cloud
              </Link>
              <Link href={data.links.enterpriseSearch ?? '/enterprise-search'} style={secondary}>
                Enterprise Search
              </Link>
              <Link href={data.links.contextFabric ?? '/context-fabric'} style={secondary}>
                Context Fabric
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Routes</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {data.routes.map((r) => (
                <li key={r.kind}>
                  <strong>{r.name}</strong> → {r.target} — {r.notes}
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

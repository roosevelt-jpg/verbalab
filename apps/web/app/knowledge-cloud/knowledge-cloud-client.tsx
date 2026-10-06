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
  workspace: { knowledgeDocuments: number; knowledgeChunks: number };
  products: Product[];
  architecture: {
    graphql: boolean;
    cqrs: boolean;
    terraform: boolean;
    kubernetes: boolean;
    enterpriseKnowledgeOs: boolean;
    ontologyOs: boolean;
    extendsVl062: boolean;
    regeneratesVl062: boolean;
    pgvector: boolean;
    billing: boolean;
    monitoring: boolean;
  };
  deferred: Record<string, boolean>;
  links: Record<string, string>;
  note: string;
};

export function KnowledgeCloudClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/knowledge-cloud/overview', { token }));
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
        Knowledge Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Enterprise knowledge hub over existing RAG and Intelligence Cloud. Extends existing
        knowledge surfaces — does not invent a SharePoint/ontology OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Docs {data.workspace.knowledgeDocuments} · Chunks {data.workspace.knowledgeChunks} ·
            Embeddings {data.usage.embeddings.requests} req
          </p>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href={data.links.knowledgeBase ?? '/knowledge-base'} style={secondary}>
                Knowledge Base
              </Link>
              <Link href={data.links.enterpriseSearch ?? '/enterprise-search'} style={secondary}>
                Enterprise Search
              </Link>
              <Link href={data.links.ontology ?? '/ontology'} style={secondary}>
                Ontology
              </Link>
              <Link href={data.links.taxonomy ?? '/taxonomy'} style={secondary}>
                Taxonomy
              </Link>
              <Link href={data.links.knowledge ?? '/knowledge'} style={secondary}>
                Knowledge / RAG
              </Link>
              <Link href={data.links.knowledgeGraph ?? '/knowledge-graph'} style={secondary}>
                Knowledge Graph
              </Link>
              <Link href={data.links.vectorCloud ?? '/vector-cloud'} style={secondary}>
                Vector Cloud
              </Link>
              <Link href={data.links.embeddingCloud ?? '/embedding-cloud'} style={secondary}>
                Embeddings
              </Link>
              <Link href={data.links.memoryCloud ?? '/memory-cloud'} style={secondary}>
                Memory Cloud
              </Link>
              <Link href={data.links.contextEngine ?? '/context-engine'} style={secondary}>
                Context Engine
              </Link>
              <Link href={data.links.intelligenceCloud ?? '/intelligence-cloud'} style={secondary}>
                Intelligence Cloud
              </Link>
              <Link href={data.links.chat ?? '/chat'} style={secondary}>
                Chat
              </Link>
              <Link href={data.links.usage ?? '/usage'} style={secondary}>
                Usage
              </Link>
              <Link href={data.links.graphql ?? '/graphql'} style={secondary}>
                GraphQL
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Architecture honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Extends existing {data.architecture.extendsVl062 ? 'yes' : 'no'} · Regenerates prior{' '}
              {data.architecture.regeneratesVl062 ? 'yes' : 'no'} · Enterprise knowledge OS{' '}
              {data.architecture.enterpriseKnowledgeOs ? 'yes' : 'no'} · Ontology OS{' '}
              {data.architecture.ontologyOs ? 'yes' : 'no'} · pgvector{' '}
              {data.architecture.pgvector ? 'yes' : 'no'} · GraphQL{' '}
              {data.architecture.graphql ? 'yes' : 'no'} · CQRS{' '}
              {data.architecture.cqrs ? 'yes (catalog slice)' : 'no'} · Terraform{' '}
              {data.architecture.terraform ? 'yes' : 'no'} · Kubernetes{' '}
              {data.architecture.kubernetes ? 'yes' : 'no'}
            </p>
          </section>

          <section>
            <h2 style={label}>Products</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {data.products.map((p) => (
                <li key={p.id} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                  <strong>{p.name}</strong>{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>· {p.status}</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{p.notes}</div>
                  {p.console ? (
                    <Link href={p.console} style={{ fontSize: '0.85rem' }}>
                      Open console
                    </Link>
                  ) : null}
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
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

const secondary: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.45rem 0.75rem',
  border: '1px solid var(--line)',
  borderRadius: '0.4rem',
  color: 'var(--ink)',
  textDecoration: 'none',
  fontSize: '0.85rem',
  fontWeight: 600,
};

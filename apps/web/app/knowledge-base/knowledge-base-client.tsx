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

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: {
    confluenceOs: boolean;
    sharePointParity: boolean;
    approvalWorkflow: boolean;
    multimodalMediaIngest: boolean;
    orgWorkspaceScoped: boolean;
    extendsVl062: boolean;
  };
};

type Analytics = {
  documents: number;
  ready: number;
  failed: number;
  chunks: number;
};

export function KnowledgeBaseClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/knowledge-base/engine', { token }),
      apiFetch<Analytics>('/v1/knowledge-base/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
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
        Enterprise Knowledge Base
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Org/workspace-scoped document store over existing. Upload on{' '}
        <Link href="/knowledge">Knowledge / RAG</Link>. Not a Confluence/SharePoint OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          {analytics ? (
            <p style={{ margin: 0, fontWeight: 600 }}>
              Docs {analytics.documents} · Ready {analytics.ready} · Failed {analytics.failed} ·
              Chunks {analytics.chunks}
            </p>
          ) : null}
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section>
            <h2 style={label}>Honesty</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Org/workspace scoped {engine.honesty.orgWorkspaceScoped ? 'yes' : 'no'} · Extends prior
               {engine.honesty.extendsVl062 ? 'yes' : 'no'} · Confluence OS{' '}
              {engine.honesty.confluenceOs ? 'yes' : 'no'} · SharePoint parity{' '}
              {engine.honesty.sharePointParity ? 'yes' : 'no'} · Approval workflow{' '}
              {engine.honesty.approvalWorkflow ? 'yes' : 'no'} · Media ingest{' '}
              {engine.honesty.multimodalMediaIngest ? 'yes' : 'no'}
            </p>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/knowledge" style={secondary}>
                Ingest / RAG
              </Link>
              <Link href="/knowledge-cloud" style={secondary}>
                Knowledge Cloud
              </Link>
              <Link href="/vector-cloud" style={secondary}>
                Vector Cloud
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.55rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>· {c.status}</span>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
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

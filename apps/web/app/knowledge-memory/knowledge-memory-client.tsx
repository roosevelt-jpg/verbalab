'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Capability = { id: string; name: string; status: string; notes: string };

type Engine = {
  product: string;
  note: string;
  capabilities: Capability[];
  honesty: {
    mem0Os: boolean;
    regeneratesMemoryCloud: boolean;
    extendsVl183: boolean;
    distinctFromMemoryCloud: boolean;
    orgWorkspaceScoped: boolean;
  };
};

type Analytics = {
  active: number;
  withDocument: number;
  evolved: number;
};

export function KnowledgeMemoryClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [scope, setScope] = useState('workspace');
  const [created, setCreated] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/knowledge-memory/engine', { token }),
      apiFetch<Analytics>('/v1/knowledge-memory/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const create = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ id: string; version: number; scope: string }>(
        '/v1/knowledge-memory/memories',
        {
          token,
          method: 'POST',
          body: JSON.stringify({ content, scope }),
        },
      );
      setCreated(`${res.scope} v${res.version} (${res.id.slice(0, 8)}…)`);
      setContent('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }, [getToken, content, scope, load]);

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
        Knowledge Memory
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Persistent knowledge-layer memory for this cloud — org/workspace/user/conversation/AI
        scopes with evolution. Backed by{' '}
        <Link href="/memory-cloud">Memory Cloud</Link> storage; distinct product surface. Not
        Mem0 / Zep OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Knowledge fact to remember"
          style={{ ...input, minWidth: '16rem', flex: 1 }}
        />
        <select value={scope} onChange={(e) => setScope(e.target.value)} style={input}>
          <option value="workspace">workspace</option>
          <option value="organization">organization</option>
          <option value="user">user</option>
          <option value="conversation">conversation</option>
          <option value="ai">ai</option>
        </select>
        <button type="button" onClick={() => void create()} disabled={!content.trim()} style={btn}>
          Remember
        </button>
      </div>
      {created ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Created: {created}</p>
      ) : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Active {analytics.active} · With document {analytics.withDocument} · Evolved{' '}
          {analytics.evolved}
        </p>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Honesty: mem0Os={String(engine.honesty.mem0Os)} · regeneratesMemoryCloud=
            {String(engine.honesty.regeneratesMemoryCloud)} · extendsVl183=
            {String(engine.honesty.extendsVl183)} · distinctFromMemoryCloud=
            {String(engine.honesty.distinctFromMemoryCloud)}
          </p>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.45rem' }}>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/knowledge-cloud">Knowledge Cloud</Link>
        {' · '}
        <Link href="/memory-cloud">Memory Cloud</Link>
        {' · '}
        <Link href="/enterprise-rag">Enterprise RAG</Link>
      </p>
    </AppShell>
  );
}

const input: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.75rem',
  background: 'var(--surface)',
  color: 'inherit',
  font: 'inherit',
};

const btn: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  background: 'var(--fg)',
  color: 'var(--bg)',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
};

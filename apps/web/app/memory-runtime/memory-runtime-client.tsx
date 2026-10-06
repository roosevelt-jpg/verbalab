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
  mode: string;
  capabilities: Capability[];
  ceilings: { maxEntriesPerWorkspace: number; defaultShortTermTtlSec: number };
  honesty: {
    mem0Os: boolean;
    infinitePersonalizationOs: boolean;
    replicationOs: boolean;
    regeneratesMemoryCloud: boolean;
    regeneratesKnowledgeMemory: boolean;
    extendsMemoryCloud: boolean;
    kernelLayerOnly: boolean;
    vectorSemanticOs: boolean;
  };
  links: Record<string, string>;
};

type Analytics = {
  total: number;
  byScope: Record<string, number>;
  byKind: Record<string, number>;
};

export function MemoryRuntimeClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [scope, setScope] = useState('workspace');
  const [kind, setKind] = useState('short_term');
  const [created, setCreated] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, ana] = await Promise.all([
      apiFetch<Engine>('/v1/memory-runtime/engine', { token }),
      apiFetch<Analytics>('/v1/memory-runtime/analytics', { token }),
    ]);
    setEngine(eng);
    setAnalytics(ana);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const put = useCallback(async  => {
    setError(null);
    try {
      const token = await getToken;
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{
        memory: { id: string; version: number; scope: string; kind: string };
      }>('/v1/memory-runtime/put', {
        token,
        method: 'POST',
        body: JSON.stringify({ content, scope, kind }),
      });
      setCreated(
        `${res.memory.scope}/${res.memory.kind} v${res.memory.version} (${res.memory.id.slice(0, 8)}…)`,
      );
      setContent('');
      await load;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Put failed');
    }
  }, [getToken, content, scope, kind, load]);

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
        Memory Runtime
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Kernel-layer memory over{' '}
        <Link href="/memory-cloud">Memory Cloud</Link> (<code>metadata.layer=kernel</code>). Short /
        long / semantic kinds with eviction ceilings — not Mem0 or multi-region replication OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Kernel memory content"
          style={{ ...input, minWidth: '16rem', flex: 1 }}
        />
        <select value={scope} onChange={(e) => setScope(e.target.value)} style={input}>
          <option value="workspace">workspace</option>
          <option value="organization">organization</option>
          <option value="conversation">conversation</option>
          <option value="agent">agent</option>
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={input}>
          <option value="short_term">short_term</option>
          <option value="long_term">long_term</option>
          <option value="semantic">semantic</option>
          <option value="shared">shared</option>
        </select>
        <button type="button" onClick={ => void put} disabled={!content.trim} style={btn}>
          Put
        </button>
      </div>
      {created ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Created: {created}</p>
      ) : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>
          Kernel entries {analytics.total}
          {engine ? ` · ceiling ${engine.ceilings.maxEntriesPerWorkspace}` : null}
        </p>
      ) : null}

      {engine ? (
        <>
          <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{engine.note}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Mode: {engine.mode} · mem0Os={String(engine.honesty.mem0Os)} · replicationOs=
            {String(engine.honesty.replicationOs)} · extendsMemoryCloud=
            {String(engine.honesty.extendsMemoryCloud)} · kernelLayerOnly=
            {String(engine.honesty.kernelLayerOnly)}
          </p>
          <ul style={{ paddingLeft: '1.2rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.45rem' }}>
                <strong>{c.name}</strong> · {c.status}
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p style={{ marginTop: '2rem' }}>
        <Link href="/ai-kernel">AI Kernel</Link>
        {' · '}
        <Link href="/memory-cloud">Memory Cloud</Link>
        {' · '}
        <Link href="/knowledge-memory">Knowledge Memory</Link>
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

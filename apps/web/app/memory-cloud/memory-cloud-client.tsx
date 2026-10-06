'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
  honesty: { gdprExport: boolean; gdprErase: boolean; infinitePersonalizationOs: boolean };
};
type Analytics = {
  activeMemories: number;
  writes: number;
  exports: number;
  erases: number;
  note: string;
};
type Memory = {
  id: string;
  scope: string;
  kind: string;
  content: string;
  version: number;
};

export function MemoryCloudClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [content, setContent] = useState('User prefers Swahili greetings in chat.');
  const [scope, setScope] = useState('workspace');
  const [kind, setKind] = useState('long_term');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, an, list] = await Promise.all([
      apiFetch<Engine>('/v1/memory-cloud/engine', { token }),
      apiFetch<Analytics>('/v1/memory-cloud/analytics', { token }),
      apiFetch<{ data: Memory[] }>('/v1/memory-cloud/memories?limit=20', { token }),
    ]);
    setEngine(eng);
    setAnalytics(an);
    setMemories(list.data);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  async function createMemory() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<Memory>('/v1/memory-cloud/memories', {
        token,
        method: 'POST',
        body: { content, scope, kind },
      });
      setResult(JSON.stringify(body, null, 2));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  async function exportMemories() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{ count: number; exportedAt: string; note: string }>(
        '/v1/memory-cloud/export',
        { token, method: 'POST', body: {} },
      );
      setResult(JSON.stringify(body, null, 2));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  async function eraseAll() {
    if (!window.confirm('Hard-erase all workspace memories? This cannot be undone.')) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const body = await apiFetch<{ erased: boolean; count: number; note: string }>(
        '/v1/memory-cloud/erase',
        { token, method: 'POST', body: { confirm: true, hard: true } },
      );
      setResult(JSON.stringify(body, null, 2));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erase failed');
    } finally {
      setLoading(false);
    }
  }

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
        Memory Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Persistent AI interaction memory with GDPR export and erase. Not infinite personalization.{' '}
        <Link href="/intelligence-cloud">Intelligence Cloud</Link> · <Link href="/data">Data / GDPR</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {analytics ? (
        <p style={{ margin: '0 0 1.25rem', fontWeight: 600 }}>
          {analytics.activeMemories} active · {analytics.writes} writes · {analytics.exports} exports ·{' '}
          {analytics.erases} erases this month
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '48rem' }}>
        <section>
          <h2 style={label}>Store memory</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.65rem',
              border: '1px solid var(--line)',
              borderRadius: '0.4rem',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="workspace">workspace</option>
              <option value="organization">organization</option>
              <option value="conversation">conversation</option>
              <option value="project">project</option>
              <option value="agent">agent</option>
            </select>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: '0.35rem', border: '1px solid var(--line)' }}
            >
              <option value="long_term">long_term</option>
              <option value="short_term">short_term</option>
              <option value="shared">shared</option>
              <option value="semantic">semantic</option>
            </select>
            <button type="button" disabled={loading} style={primary} onClick={() => void createMemory()}>
              Save
            </button>
            <button type="button" disabled={loading} style={secondary} onClick={() => void exportMemories()}>
              Export (GDPR)
            </button>
            <button type="button" disabled={loading} style={danger} onClick={() => void eraseAll()}>
              Erase all
            </button>
          </div>
          {result ? <pre style={pre}>{result}</pre> : null}
        </section>

        <section>
          <h2 style={label}>Recent memories</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {memories.map((m) => (
              <li key={m.id} style={{ borderTop: '1px solid var(--line)', padding: '0.45rem 0' }}>
                <strong>
                  {m.scope}/{m.kind}
                </strong>{' '}
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>v{m.version}</span>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{m.content}</div>
              </li>
            ))}
            {memories.length === 0 ? (
              <li style={{ color: 'var(--muted)' }}>No active memories yet.</li>
            ) : null}
          </ul>
        </section>

        {engine ? (
          <section>
            <h2 style={label}>Capabilities</h2>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              {engine.note} GDPR export {engine.honesty.gdprExport ? 'yes' : 'no'} · erase{' '}
              {engine.honesty.gdprErase ? 'yes' : 'no'}.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {engine.capabilities.map((c) => (
                <li key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '0.4rem 0' }}>
                  <strong>{c.name}</strong>{' '}
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
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

const primary: React.CSSProperties = {
  padding: '0.65rem 1.1rem',
  background: 'var(--ink)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const secondary: React.CSSProperties = {
  ...primary,
  background: 'transparent',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
};

const danger: React.CSSProperties = {
  ...primary,
  background: '#b42318',
};

const pre: React.CSSProperties = {
  margin: '0.75rem 0 0',
  padding: '0.85rem',
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  overflow: 'auto',
  fontSize: '0.8rem',
};

'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  honesty: {
    redisClusterOs: boolean;
    vectorSemanticOs: boolean;
    autoWiresGatewayResponses: boolean;
    exactKeyLookup: boolean;
  };
  ceilings: { maxEntriesPerWorkspace: number; defaultTtlSec: number; mode: string };
  spendSafety: { note: string };
};

type Ns = { id: string; name: string; status: string; notes: string };

export function IntelligentCacheClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [namespaces, setNamespaces] = useState<Ns[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, ns] = await Promise.all([
      apiFetch<Engine>('/v1/intelligent-cache/engine', { token }),
      apiFetch<{ namespaces: Ns[] }>('/v1/intelligent-cache/namespaces', { token }),
    ]);
    setEngine(eng);
    setNamespaces(ns.namespaces);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh().catch((err: Error) => setError(err.message));
  }, [isLoaded, refresh]);

  const demo = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/intelligent-cache/put', {
        token,
        method: 'POST',
        body: JSON.stringify({
          namespace: 'translation',
          key: 'en:sw:hello',
          value: { text: 'habari' },
        }),
      });
      const hit = await apiFetch<{ hit: boolean; entry?: { value: unknown } }>(
        '/v1/intelligent-cache/lookup',
        {
          token,
          method: 'POST',
          body: JSON.stringify({ namespace: 'translation', key: 'en:sw:hello' }),
        },
      );
      setResult(hit.hit ? JSON.stringify(hit.entry?.value) : 'miss');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cache demo failed');
    } finally {
      setBusy(false);
    }
  };

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
        Intelligent Cache
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Opt-in exact-key inference cache. Not Redis Cluster or vector semantic OS.{' '}
        <Link href="/inference-cloud">Inference Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}

      {engine ? (
        <section
          style={{
            borderLeft: '3px solid #0f766e',
            paddingLeft: '0.85rem',
            marginBottom: '1.75rem',
            maxWidth: '44rem',
          }}
        >
          <h2 style={label}>Honesty</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{engine.spendSafety.note}</p>
          <p style={{ margin: '0.35rem 0 0' }}>
            maxEntries={engine.ceilings.maxEntriesPerWorkspace} · ttl=
            {engine.ceilings.defaultTtlSec}s · redisCluster=
            {String(engine.honesty.redisClusterOs)} · vector=
            {String(engine.honesty.vectorSemanticOs)} · autoWireGateway=
            {String(engine.honesty.autoWiresGatewayResponses)}
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: '1.75rem', maxWidth: '48rem' }}>
        <h2 style={label}>Namespaces</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {namespaces.map((n) => (
            <li key={n.id} style={{ marginBottom: '0.4rem' }}>
              <strong>{n.name}</strong> · {n.status} — {n.notes}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={busy}
          onClick={() => void demo()}
          style={{
            marginTop: '0.85rem',
            border: '1px solid var(--border)',
            background: 'transparent',
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
          }}
        >
          Put + lookup translation demo
        </button>
        {result ? (
          <p style={{ marginTop: '0.75rem' }}>
            Lookup: <code>{result}</code>
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};

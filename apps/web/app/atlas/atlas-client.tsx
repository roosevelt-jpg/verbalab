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
  honesty: {
    shipsTrainedAtlasWeights: boolean;
    openAiReplacementOs: boolean;
    frontierLabOs: boolean;
    scaffoldOnly: boolean;
  };
  capabilities: Capability[];
};

export function AtlasClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setEngine(await apiFetch<Engine>('/v1/atlas/engine', { token }));
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
        Atlas
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '44rem' }}>
        Large multilingual reasoning family scaffold — interface and MLOps handoffs, not trained
        competitive weights.{' '}
        <Link href="/foundation-model-cloud">Foundation Model Cloud</Link>.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section
            style={{
              borderLeft: '3px solid #b45309',
              paddingLeft: '0.85rem',
            }}
          >
            <h2 style={label}>Honesty</h2>
            <ul style={{ margin: 0, color: 'var(--muted)' }}>
              <li>scaffoldOnly: {String(engine.honesty.scaffoldOnly)}</li>
              <li>
                shipsTrainedAtlasWeights: {String(engine.honesty.shipsTrainedAtlasWeights)}
              </li>
              <li>openAiReplacementOs: {String(engine.honesty.openAiReplacementOs)}</li>
              <li>frontierLabOs: {String(engine.honesty.frontierLabOs)}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/reasoning-runtime" style={secondary}>
                Reasoning Runtime
              </Link>
              <Link href="/model-training-platform" style={secondary}>
                Training Platform
              </Link>
              <Link href="/model-evaluation-platform" style={secondary}>
                Evaluation Platform
              </Link>
              <Link href="/chat" style={secondary}>
                Chat
              </Link>
              <Link href="/model-serving" style={secondary}>
                Model Serving
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
              {engine.capabilities.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> ({c.status}) — {c.notes}
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

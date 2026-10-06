'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Engine = {
  product: string;
  note: string;
  honesty: Record<string, boolean>;
  safety?: { note?: string } & Record<string, unknown>;
};

export function AgentopsPlatformClient() {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Engine>('/v1/agentops-platform/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        AgentOps Platform
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        VL-287 — VerbaLab AgentOps Platform console in the MLOps & LLMOps Cloud.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{data.note}</p>
          {data.safety?.note ? (
            <p style={{ margin: 0, borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}>
              {String(data.safety.note)}
            </p>
          ) : null}
          <pre style={{ margin: 0, padding: '1rem', background: 'var(--surface)', overflow: 'auto', fontSize: '0.78rem' }}>
            {JSON.stringify({ honesty: data.honesty }, null, 2)}
          </pre>
        </div>
      ) : null}
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: string }
  | { kind: 'error'; message: string };

export function ApiHealth {
  const [state, setState] = useState<HealthState>({ kind: 'loading' });

  useEffect( => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    let cancelled = false;

    async function load {
      try {
        const response = await fetch(`${base}/health`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const body = (await response.json) as { status?: string };
        if (!cancelled) {
          setState({ kind: 'ok', status: body.status ?? 'unknown' });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: 'error',
            message: error instanceof Error ? error.message : 'Request failed',
          });
        }
      }
    }

    void load;
    return  => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        marginTop: '1.75rem',
        padding: '1rem 1.1rem',
        borderRadius: '0.85rem',
        background: 'var(--accent-soft)',
        border: '1px solid var(--line)',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
        API /health
      </div>
      {state.kind === 'loading' && <div>Checking…</div>}
      {state.kind === 'ok' && (
        <div style={{ color: 'var(--ok)', fontWeight: 600 }}>status: {state.status}</div>
      )}
      {state.kind === 'error' && (
        <div style={{ color: 'var(--bad)' }}>
          unreachable ({state.message}). Start the API with <code>pnpm dev</code>.
        </div>
      )}
    </div>
  );
}

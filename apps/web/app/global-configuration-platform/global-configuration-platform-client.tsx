'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { HubConsole } from '@/components/hub-console';

type Engine = {
  product: string;
  note: string;
  honesty: Record<string, boolean | string>;
  safety?: { note?: string } & Record<string, unknown>;
};

export function GlobalConfigurationPlatformClient() {
  const [data, setData] = useState<Engine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Engine>('/v1/global-configuration-platform/engine')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <HubConsole
      title="Global Configuration Platform"
      lede="Global Configuration Platform console in the Control Plane Cloud. Prefill catalog below — live engine data appears when the API is reachable."
    >
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
    </HubConsole>
  );
}

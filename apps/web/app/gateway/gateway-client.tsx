'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Provider = {
  id: string;
  libraryName: string;
  status: string;
  features: string[];
  configured: boolean;
  notes: string;
};

type Overview = {
  health: { status: string; region: string };
  configured: Record<string, boolean>;
  providers: Provider[];
  capabilities: {
    fallback: string[];
    caching: { responseCache: boolean };
    streaming: boolean;
    costOptimization: boolean;
  };
  volume: { closes: string; note: string };
  links: Record<string, string>;
};

export function GatewayClient() {
  const { getToken, isLoaded } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/gateway/overview', { token }));
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
        AI Gateway
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Thin facade over bought models — Google MT, OpenAI, optional OpenRouter chat fallback, own TTS,
        and fine-tune routes. Not an Inference Cloud.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p>: null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p>: null}

      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <section>
            <h2 style={label}>Health</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {data.health.status} · region {data.health.region}
            </p>
          </section>

          <section>
            <h2 style={label}>Configured credentials</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(data.configured).map(([key, on]) => (
                <li
                  key={key}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.55rem',
                    border: '1px solid var(--line)',
                    borderRadius: '0.35rem',
                    background: on ? 'var(--bg-soft)': 'transparent',
                    color: on ? 'var(--ink)': 'var(--muted)',
                  }}
                >
                  {key}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Providers</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
              {data.providers.map((p) => (
                <li key={p.id} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.65rem' }}>
                  <div style={{ fontWeight: 600 }}>
                    {p.libraryName}{' '}
                    <span style={{ fontWeight: 500, color: 'var(--muted)', fontSize: '0.85rem' }}>
                      · {p.status}
                      {p.status !== 'deferred' ? (p.configured ? ' · configured': ' · not configured'): ''}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {p.features.join(', ')} — {p.notes}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={label}>Capabilities</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              Fallbacks: {data.capabilities.fallback.join('; ')}. Response cache:{' '}
              {data.capabilities.caching.responseCache ? 'yes': 'no'}. Streaming:{' '}
              {data.capabilities.streaming ? 'yes': 'no'}. Cost optimizer:{' '}
              {data.capabilities.costOptimization ? 'yes': 'no'}.
            </p>
          </section>

          <section style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <Link href={data.links.models} style={linkBtn}>
              Models
            </Link>
            <Link href={data.links.finetunes} style={linkBtn}>
              Fine-tunes
            </Link>
            <Link href={data.links.chat} style={linkBtn}>
              Chat
            </Link>
            <Link href={data.links.audio} style={linkBtn}>
              Voice Studio
            </Link>
          </section>

          <section>
            <h2 style={label}>Status</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>{data.volume.closes}</p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{data.volume.note}</p>
          </section>
        </div>
      ): null}
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

const linkBtn: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.65rem 1.1rem',
  border: '1px solid var(--line)',
  borderRadius: '0.45rem',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--ink)',
};

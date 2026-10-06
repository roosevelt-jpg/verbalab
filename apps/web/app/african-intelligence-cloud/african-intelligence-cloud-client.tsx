'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Product = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

type Overview = {
  products: Product[];
  honesty: Record<string, boolean>;
  safety: { note: string } & Record<string, boolean | string>;
  note: string;
  links: Record<string, string>;
};

export function AfricanIntelligenceCloudClient {
  const { getToken, isLoaded } = useAuth;
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    setData(await apiFetch<Overview>('/v1/african-intelligence-cloud/overview', { token }));
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  return (
    <AppShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}>
        African Intelligence Cloud
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        African knowledge and language intelligence hub — extends Language/Knowledge/Intelligence clouds.
      </p>
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!data && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}
      {data ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{data.note}</p>
          <section style={{ borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem' }}>
            <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: '0 0 0.35rem' }}>Safety</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>{data.safety.note}</p>
          </section>
          <section>
            <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: '0 0 0.75rem' }}>Products</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.85rem' }}>
              {data.products.map((p) => (
                <li key={p.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    {p.console ? <Link href={p.console}>{p.name}</Link> : <span>{p.name}</span>}
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{p.status}</span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>{p.notes}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

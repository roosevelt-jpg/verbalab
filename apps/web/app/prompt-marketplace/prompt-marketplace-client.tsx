'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Listing = {
  id: string;
  title: string;
  category: string;
  licenseType: string;
  promptVersion: string;
  promptCount: number;
  verified: boolean;
  priceCents: number;
  publisherName: string | null;
};

type Engine = {
  product: string;
  note: string;
  safety: { note: string; storesRawCardData: boolean; stripeOrEquivalentRequired: boolean };
  honesty: {
    promptMeshOs: boolean;
    autoPromptResearchOs: boolean;
    storesRawCardData: boolean;
    stripeOrEquivalentRequired: boolean;
  };
};

export function PromptMarketplaceClient {
  const { getToken, isLoaded } = useAuth;
  const [engine, setEngine] = useState<Engine | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async  => {
    const token = await getToken;
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/prompt-marketplace/engine', { token }),
      apiFetch<{ listings: Listing[] }>('/v1/prompt-marketplace/listings', { token }),
    ]);
    setEngine(eng);
    setListings(list.listings);
  }, [getToken]);

  useEffect( => {
    if (!isLoaded) return;
    void load.catch((err: Error) => setError(err.message));
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
        Prompt Marketplace
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        License prompt packs over content-marketplace prompt kind + Prompt Fabric — not a prompt
        mesh OS.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section style={{ borderLeft: '3px solid #b45309', paddingLeft: '0.85rem' }}>
            <h2 style={label}>Real-money safety</h2>
            <p style={{ margin: 0, maxWidth: '44rem', color: 'var(--muted)' }}>
              {engine.safety.note}
            </p>
            <ul style={{ margin: '0.5rem 0 0', color: 'var(--muted)' }}>
              <li>
                stripeOrEquivalentRequired:{' '}
                {String(engine.honesty.stripeOrEquivalentRequired)}
              </li>
              <li>storesRawCardData: {String(engine.honesty.storesRawCardData)}</li>
              <li>promptMeshOs: {String(engine.honesty.promptMeshOs)}</li>
              <li>autoPromptResearchOs: {String(engine.honesty.autoPromptResearchOs)}</li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/prompts" style={secondary}>
                Prompt manager
              </Link>
              <Link href="/prompt-fabric" style={secondary}>
                Prompt Fabric
              </Link>
              <Link href="/marketplace" style={secondary}>
                Content marketplace
              </Link>
              <Link href="/ecosystem-cloud" style={secondary}>
                Ecosystem Cloud
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Listings</h2>
            {listings.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                No Prompt Marketplace listings yet. Publish an active prompt pack here.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                {listings.map((l) => (
                  <li key={l.id}>
                    <strong>{l.title}</strong> ({l.category} · {l.promptVersion})
                    {l.promptCount > 0 ? ` · ${l.promptCount} prompts` : ''} —{' '}
                    {l.publisherName ?? 'publisher'}
                    {l.priceCents > 0 ? ` · $${(l.priceCents / 100).toFixed(2)}` : ' · free'}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

const label: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 0.5rem',
  color: 'var(--muted)',
};

const secondary: CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.7rem',
  border: '1px solid var(--border, #ddd)',
  borderRadius: 4,
  textDecoration: 'none',
  color: 'inherit',
  fontSize: '0.9rem',
};

'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Listing = {
  id: string;
  title: string;
  packType: string;
  packKey: string;
  packVersion: string;
  verified: boolean;
  voiceCdnHosted: boolean;
  priceCents: number;
  ratingAverage: number | null;
  ratingCount: number;
  publisherName: string | null;
};

type Engine = {
  product: string;
  note: string;
  safety: { note: string; storesRawCardData: boolean; stripeOrEquivalentRequired: boolean };
  honesty: {
    thirdPartyVoiceOs: boolean;
    voiceCdnOs: boolean;
    celebrityWithoutRights: boolean;
    crossTenantCloneSynthesis: boolean;
    storesRawCardData: boolean;
    stripeOrEquivalentRequired: boolean;
  };
};

export function VoiceLanguageMarketplaceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/voice-language-marketplace/engine', { token }),
      apiFetch<{ listings: Listing[] }>('/v1/voice-language-marketplace/listings', { token }),
    ]);
    setEngine(eng);
    setListings(list.listings);
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
        Voice & Language Marketplace
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        License voice and language pack SKUs over VL-177 + Volume 1 — not third-party TTS or a voice CDN.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {!engine && !error ? <p style={{ color: 'var(--muted)' }}>Loading…</p> : null}

      {engine ? (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>

          <section style={{ borderLeft: '3px solid #0369a1', paddingLeft: '0.85rem' }}>
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
              <li>thirdPartyVoiceOs: {String(engine.honesty.thirdPartyVoiceOs)}</li>
              <li>voiceCdnOs: {String(engine.honesty.voiceCdnOs)}</li>
              <li>celebrityWithoutRights: {String(engine.honesty.celebrityWithoutRights)}</li>
              <li>
                crossTenantCloneSynthesis: {String(engine.honesty.crossTenantCloneSynthesis)}
              </li>
            </ul>
          </section>

          <section>
            <h2 style={label}>Links</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              <Link href="/voice-marketplace" style={secondary}>
                Voice Marketplace
              </Link>
              <Link href="/ecosystem-cloud" style={secondary}>
                Ecosystem Cloud
              </Link>
              <Link href="/dialects" style={secondary}>
                Dialects
              </Link>
            </div>
          </section>

          <section>
            <h2 style={label}>Listings</h2>
            {listings.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                No published pack listings yet. Publish a catalog key (e.g. language.sw) here.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7 }}>
                {listings.map((l) => (
                  <li key={l.id}>
                    <strong>{l.title}</strong> ({l.packType} · {l.packKey} · {l.packVersion})
                    {l.verified ? ' · verified' : ''} — {l.publisherName ?? 'publisher'}
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

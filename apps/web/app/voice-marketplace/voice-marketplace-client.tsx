'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Listing = {
  id: string;
  title: string;
  kind: string;
  sourceVoiceId: string;
  licenseType: string;
  priceCents: number;
  ratingAverage: number | null;
  ratingCount: number;
  publisherName: string | null;
};
type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};

export function VoiceMarketplaceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [title, setTitle] = useState('Nova Studio Stock');
  const [voiceId, setVoiceId] = useState('nova');
  const [priceCents, setPriceCents] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not signed in');
    const [eng, list] = await Promise.all([
      apiFetch<Engine>('/v1/voice-marketplace/engine', { token }),
      apiFetch<{ listings: Listing[] }>('/v1/voice-marketplace/listings', { token }),
    ]);
    setEngine(eng);
    setListings(list.listings);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function publish() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/voice-marketplace/listings', {
        token,
        method: 'POST',
        body: JSON.stringify({
          title,
          sourceVoiceId: voiceId,
          kind: 'voice',
          licenseType: 'personal',
          priceCents,
          rightsAttested: true,
        }),
      });
      setMessage('Published');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  }

  async function install(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ note: string }>(`/v1/voice-marketplace/listings/${id}/install`, {
        token,
        method: 'POST',
        body: JSON.stringify({}),
      });
      setMessage(res.note);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Install failed');
    } finally {
      setBusy(false);
    }
  }

  async function rate(id: string) {
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in');
      await apiFetch(`/v1/voice-marketplace/listings/${id}/reviews`, {
        token,
        method: 'POST',
        body: JSON.stringify({ rating: 5, body: 'Clear and usable.' }),
      });
      setMessage('Review saved');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setBusy(false);
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
        Voice Marketplace
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}>
        Publish and license voice SKUs with ratings. Distinct from localization Marketplace. Celebrity
        SKUs without rights are blocked.
      </p>

      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}

      <section style={{ display: 'grid', gap: '0.75rem', maxWidth: '40rem', marginBottom: '1.75rem' }}>
        <h2 style={h2}>Publish stock / own voice</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={input} placeholder="Title" />
        <input
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          style={input}
          placeholder="Voice id (nova, own:sw-aisha, …)"
        />
        <input
          type="number"
          value={priceCents}
          onChange={(e) => setPriceCents(Number(e.target.value))}
          style={input}
          placeholder="Price cents (0 = free)"
        />
        <button type="button" disabled={busy} onClick={() => void publish()} style={primary}>
          Publish
        </button>
      </section>

      <section style={{ marginBottom: '1.75rem' }}>
        <h2 style={h2}>Catalog</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {listings.map((l) => (
            <li
              key={l.id}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ fontWeight: 600 }}>{l.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {l.kind} · {l.sourceVoiceId} · {l.licenseType} ·{' '}
                {l.priceCents ? `$${(l.priceCents / 100).toFixed(2)}` : 'Free'}
                {l.ratingAverage != null ? ` · ★ ${l.ratingAverage} (${l.ratingCount})` : ''}
                {l.publisherName ? ` · ${l.publisherName}` : ''}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" disabled={busy} onClick={() => void install(l.id)} style={secondary}>
                  License / install
                </button>
                <button type="button" disabled={busy} onClick={() => void rate(l.id)} style={secondary}>
                  Rate 5★
                </button>
              </div>
            </li>
          ))}
          {!listings.length ? (
            <li style={{ color: 'var(--muted)' }}>No published voice listings yet (Pro plan required).</li>
          ) : null}
        </ul>
      </section>

      {engine ? (
        <section style={{ marginBottom: '1.75rem' }}>
          <h2 style={h2}>Capabilities</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{engine.note}</p>
          <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem' }}>
            {engine.capabilities.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.35rem' }}>
                <strong>{c.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{c.notes}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        <Link href="/marketplace">Localization Marketplace</Link>
        {' · '}
        <Link href="/voice-cloning">Voice Cloning</Link>
        {' · '}
        <Link href="/voice-cloud">Voice Cloud</Link>
      </p>
    </AppShell>
  );
}

const h2: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.15rem',
  fontWeight: 650,
  margin: '0 0 0.5rem',
};
const input: CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  font: 'inherit',
  background: '#fff',
};
const primary: CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  background: 'var(--ink)',
  color: '#fff',
  fontWeight: 550,
  cursor: 'pointer',
  width: 'fit-content',
};
const secondary: CSSProperties = {
  ...primary,
  background: 'var(--bg-soft)',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
};

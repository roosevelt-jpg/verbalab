'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';
import { SearchableCombobox, type ComboboxOption } from '@/components/searchable-combobox';

type Listing = {
  id: string;
  title: string;
  kind: string;
  sourceVoiceId: string;
  previewVoiceId?: string;
  language: string | null;
  licenseType: string;
  priceCents: number;
  ratingAverage: number | null;
  ratingCount: number;
  publisherName: string | null;
  snapshot?: { voices?: string[]; nameEn?: string; nameNative?: string | null };
};
type Engine = {
  product: string;
  note: string;
  languagePackCount?: number;
  capabilities: Array<{ id: string; name: string; notes: string }>;
};

export function VoiceMarketplaceClient() {
  const { getToken, isLoaded } = useAuth();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [langFilter, setLangFilter] = useState('');
  const [title, setTitle] = useState('Nova Studio Stock');
  const [voiceId, setVoiceId] = useState('nova');
  const [priceCents, setPriceCents] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { play, stop, playingId, loadingId, status, error: playError } = useDemoPlayer();

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

  const languageOptions: ComboboxOption[] = useMemo(() => {
    const byCode = new Map<string, ComboboxOption>();
    for (const l of listings) {
      if (!l.language) continue;
      if (byCode.has(l.language)) continue;
      const name =
        l.snapshot?.nameEn ??
        (l.title.endsWith(' Pack') ? l.title.slice(0, -5) : l.title);
      byCode.set(l.language, {
        value: l.language,
        label: `${name} (${l.language})`,
        keywords: `${name} ${l.language} ${l.snapshot?.nameNative ?? ''} ${l.title}`,
      });
    }
    return [
      { value: '', label: 'All languages', keywords: 'all every' },
      ...Array.from(byCode.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (!langFilter) return listings;
    return listings.filter((l) => l.language === langFilter);
  }, [listings, langFilter]);

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
      {playError ? <p style={{ color: '#b42318' }} role="alert">{playError}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}
      {status ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }} role="status" aria-live="polite">
          {status}
        </p>
      ) : null}

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
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
          {engine?.languagePackCount
            ? `${engine.languagePackCount} language packs in registry`
            : 'Language packs from the full Lugemi registry'}
          {langFilter
            ? ` · showing ${filteredListings.length}`
            : listings.length
              ? ` · ${listings.length} listed`
              : ''}
        </p>
        <div style={{ maxWidth: '28rem', marginBottom: '0.85rem' }}>
          <SearchableCombobox
            value={langFilter}
            onChange={setLangFilter}
            options={languageOptions}
            placeholder="Filter by language…"
            emptyLabel="All languages"
            aria-label="Filter marketplace catalog by language"
          />
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {filteredListings.map((l) => (
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
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <DemoPlayStopButton
                  active={playingId === `mp-${l.id}`}
                  loading={loadingId === `mp-${l.id}`}
                  variant="chip"
                  label="Play preview"
                  stopLabel="Stop"
                  ariaLabel={
                    playingId === `mp-${l.id}` || loadingId === `mp-${l.id}`
                      ? `Stop ${l.title}`
                      : `Play preview of ${l.title}`
                  }
                  onStop={stop}
                  onPlay={() => {
                    const previewVoice =
                      l.previewVoiceId ??
                      l.snapshot?.voices?.[0] ??
                      (l.language ? `own:${l.language}-pack` : 'nova');
                    void play({
                      id: `mp-${l.id}`,
                      text: `Hello from ${l.title}. This is a Lugemi marketplace voice preview.`,
                      voiceId: previewVoice,
                      lang: l.language ?? undefined,
                      label: l.title,
                    });
                  }}
                />
                <button type="button" disabled={busy} onClick={() => void install(l.id)} style={secondary}>
                  License / install
                </button>
                <button type="button" disabled={busy} onClick={() => void rate(l.id)} style={secondary}>
                  Rate 5★
                </button>
              </div>
            </li>
          ))}
          {!filteredListings.length ? (
            <li style={{ color: 'var(--muted)' }}>
              {listings.length
                ? 'No listings match this language filter.'
                : 'No published voice listings yet (Pro plan required).'}
            </li>
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

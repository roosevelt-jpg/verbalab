'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';

type Listing = {
  id: string;
  title: string;
  kind: string;
  language: string | null;
  licenseType: string;
  priceCents: number;
  ratingAverage: number | null;
  publisherName: string | null;
};

type Voice = {
  id: string;
  name: string;
  languages?: string[];
  personality?: string;
  category?: string;
};

const FILTERS = ['Conversational', 'Narration', 'Characters', 'Social Media', 'Educational', 'Advertisement'];


export function CreativeVoicesClient() {
  if (!isClerkConfigured()) {
    return <CreativeVoicesClientInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeVoicesClientAuthed />;
}

function CreativeVoicesClientAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeVoicesClientInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeVoicesClientInner({ getToken, isLoaded }: { getToken: () => Promise<string | null>; isLoaded: boolean }) {
  // auth via props: getToken, isLoaded
  const [tab, setTab] = useState<'explore' | 'mine'>('explore');
  const [listings, setListings] = useState<Listing[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { play, stop, playingId, loadingId, status, error: playError } = useDemoPlayer();

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to browse voices.');
    const [market, tts] = await Promise.all([
      apiFetch<{ listings: Listing[] }>('/v1/voice-marketplace/listings', { token }).catch(() => ({ listings: [] })),
      apiFetch<{ data: Voice[] }>('/v1/tts/voices', { token }).catch(() => ({ data: [] })),
    ]);
    setListings(market.listings);
    setVoices(tts.data);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const exploreRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMarket = listings.map((l) => ({
      id: l.id,
      name: l.title,
      meta: [l.language, l.licenseType, l.publisherName].filter(Boolean).join(' · '),
      letter: l.title.slice(0, 1).toUpperCase(),
    }));
    const fromTts = voices.map((v) => ({
      id: v.id,
      name: v.name,
      meta: [v.category || 'Stock', v.personality, v.languages?.[0]].filter(Boolean).join(' · '),
      letter: v.name.slice(0, 1).toUpperCase(),
    }));
    const merged = [...fromMarket, ...fromTts];
    return merged.filter((r) => {
      if (filter && !r.meta.toLowerCase().includes(filter.toLowerCase()) && !r.name.toLowerCase().includes(filter.toLowerCase())) {
        return false;
      }
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.meta.toLowerCase().includes(q);
    });
  }, [listings, voices, query, filter]);

  return (
    <CreativeShell banner breadcrumb="Voices">
      <div className="lg-creative-page-head">
        <div>
          <h1>Voices</h1>
          <p>Explore the marketplace and stock Echo voices, or jump to cloning for My Voices enrollment.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/voice-marketplace" className="lg-creative-btn">
            Marketplace console
          </Link>
          <Link href="/creative/voice-creation" className="lg-creative-btn primary">
            <CreativeIcon name="plus" width={16} height={16} />
            Create Voice
          </Link>
        </div>
      </div>

      <div className="lg-creative-tabs">
        <button type="button" className={tab === 'explore' ? 'is-active' : undefined} onClick={() => setTab('explore')}>
          Explore
        </button>
        <button type="button" className={tab === 'mine' ? 'is-active' : undefined} onClick={() => setTab('mine')}>
          My Voices
        </button>
      </div>

      {tab === 'explore' ? (
        <>
          <div className="lg-creative-toolbar">
            <label className="lg-creative-field">
              <CreativeIcon name="search" width={16} height={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search library voices…"
                aria-label="Search voices"
              />
            </label>
          </div>
          <div className="lg-creative-chips" style={{ marginBottom: '1rem' }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(filter === f ? null : f)}
                style={filter === f ? { borderColor: 'var(--lc-teal)', color: 'var(--lc-navy)' } : undefined}
              >
                {f}
              </button>
            ))}
          </div>
          {error ? <p className="lg-creative-error">{error}</p> : null}
          {exploreRows.length === 0 ? (
            <div className="lg-creative-empty">
              <strong>No voices match</strong>
              Try clearing filters, or open the marketplace console.
            </div>
          ) : (
            <>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--lc-navy)' }}>Trending voices</h2>
              <div className="lg-creative-voice-grid">
                {exploreRows.slice(0, 24).map((r) => (
                  <article key={r.id} className="lg-creative-voice-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      <div className="lg-creative-voice-avatar">{r.letter}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 650, color: 'var(--lc-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>{r.meta || 'Voice'}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'space-between' }}>
                      <DemoPlayStopButton
                        active={playingId === `voice-${r.id}`}
                        loading={loadingId === `voice-${r.id}`}
                        variant="chip"
                        label="Preview"
                        stopLabel="Stop"
                        ariaLabel={`Preview voice ${r.name}`}
                        onStop={stop}
                        onPlay={() => {
                          void play({
                            id: `voice-${r.id}`,
                            text: `Welcome to Lugemi. Speaking with ${r.name}.`,
                            voiceId: r.id.startsWith('own:') ? r.id : `own:${r.id}`,
                            label: r.name,
                          });
                        }}
                      />
                      <Link
                        href={`/creative/text-to-speech?voice=${encodeURIComponent(r.id)}`}
                        className="lg-creative-btn"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', textDecoration: 'none' }}
                      >
                        Use in TTS
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          <section style={{ marginTop: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--lc-navy)' }}>Handpicked for your use case</h2>
            <div className="lg-creative-inspo">
              {[
                { title: 'Great voices for Echo', href: '/creative/text-to-speech', art: 'linear-gradient(135deg,#10264d,#00b8ae)' },
                { title: 'Narration & docs', href: '/creative/audiobooks', art: 'linear-gradient(135deg,#0a3d3a,#3a5a8a)' },
                { title: 'Studio conversational', href: '/creative/studio', art: 'linear-gradient(135deg,#007c78,#10264d)' },
              ].map((c) => (
                <Link key={c.title} href={c.href}>
                  <div className="lg-creative-inspo-art" style={{ background: c.art }} />
                  <figcaption>{c.title}</figcaption>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="lg-creative-empty">
          <strong>No personal clones listed here yet</strong>
          Enroll Instant or Professional clones in Voice Creation. Your library lives in the cloning console.
          <div style={{ marginTop: '1rem' }}>
            <Link href="/creative/voice-creation" className="lg-creative-btn primary">
              Create a voice
            </Link>
          </div>
        </div>
      )}
    </CreativeShell>
  );
}

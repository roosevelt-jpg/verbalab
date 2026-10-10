'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { useCreativeCredits } from '@/hooks/use-creative-credits';
import { formatCredits } from '@/lib/creative-audio';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';
import {
  HISTORY_KEYS,
  loadCreativeHistory,
  pushCreativeHistory,
  type CreativeHistoryItem,
} from '@/lib/creative-tool-history';

const PROMPTS = ['Upbeat Pop Anthem', 'Melancholy Piano Ballad', 'Aggressive Electronic Track'];

const CATEGORIES = [
  { id: 'corporate', label: 'Corporate', bg: 'linear-gradient(135deg,#10264d,#3a5a8a)' },
  { id: 'cinematic', label: 'Cinematic', bg: 'linear-gradient(135deg,#0c2a4a,#087f78)' },
  { id: 'podcasts', label: 'Podcasts', bg: 'linear-gradient(135deg,#0a3d3a,#00b8ae)' },
  { id: 'advertising', label: 'Advertising', bg: 'linear-gradient(135deg,#163a2e,#1f6f66)' },
  { id: 'education', label: 'Education', bg: 'linear-gradient(135deg,#1a2740,#2d6a66)' },
  { id: 'social', label: 'Social', bg: 'linear-gradient(135deg,#10264d,#007c78)' },
  { id: 'lifestyle', label: 'Lifestyle', bg: 'linear-gradient(135deg,#0e3a4a,#2a7a72)' },
  { id: 'fitness', label: 'Fitness', bg: 'linear-gradient(135deg,#0a2f3a,#00a39a)' },
];

const MARKETPLACE = [
  {
    id: '1',
    title: 'Lagos morning commute bed',
    tags: 'Afrobeats · Lifestyle',
    duration: '1:00',
    genre: 'Afrobeats',
  },
  {
    id: '2',
    title: 'Quiet documentary underscore',
    tags: 'Cinematic · Piano',
    duration: '2:10',
    genre: 'Cinematic',
  },
  {
    id: '3',
    title: 'Product launch sting',
    tags: 'Advertising · Electronic',
    duration: '0:12',
    genre: 'Electronic',
  },
  {
    id: '4',
    title: 'Classroom focus loop',
    tags: 'Education · Ambient',
    duration: '3:00',
    genre: 'Ambient',
  },
];

function MusicInner() {
  const search = useSearchParams();
  const credits = useCreativeCredits();
  const [tab, setTab] = useState<'marketplace' | 'generations' | 'saved'>('marketplace');
  const [prompt, setPrompt] = useState(() => search.get('q') || '');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [variations] = useState(2);
  const [duration] = useState('1:00');
  const [saved, setSaved] = useState<CreativeHistoryItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const { play, stop, playingId, loadingId } = useDemoPlayer();

  useEffect(() => {
    setSaved(loadCreativeHistory(HISTORY_KEYS.music));
  }, []);

  useEffect(() => {
    const q = search.get('q');
    if (q) setPrompt(q);
  }, [search]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MARKETPLACE.filter((r) => {
      if (genre && !r.tags.toLowerCase().includes(genre.toLowerCase()) && r.genre.toLowerCase() !== genre.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || r.tags.toLowerCase().includes(q);
    });
  }, [query, genre]);

  function onGenerate(e: FormEvent) {
    e.preventDefault();
    const p = prompt.trim();
    if (!p) {
      setMessage('Describe a track to save generation intent.');
      return;
    }
    const next = pushCreativeHistory(HISTORY_KEYS.music, {
      name: p.slice(0, 80),
      kind: 'music-prompt',
      meta: `${variations} variations · ${duration}`,
      format: 'intent',
    });
    setSaved(next);
    setTab('generations');
    setMessage(
      `Lugemi does not ship a metered music model yet. Your prompt is saved locally — use Text to Speech for spoken intros, or upload stems in Assets / Studio.`,
    );
  }

  return (
    <CreativeShell banner breadcrumb="Music">
      <div className="lg-creative-page-head">
        <div>
          <h1>Music</h1>
          <p>Browse reference beds and queue generation intent. Music synthesis is a roadmap companion.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/creative/text-to-speech" className="lg-creative-btn">
            Speech beds
          </Link>
          <Link href="/creative/assets" className="lg-creative-btn primary">
            Upload stems
          </Link>
        </div>
      </div>

      <div className="lg-creative-tabs">
        <button type="button" className={tab === 'marketplace' ? 'is-active' : undefined} onClick={() => setTab('marketplace')}>
          Marketplace
        </button>
        <button type="button" className={tab === 'generations' ? 'is-active' : undefined} onClick={() => setTab('generations')}>
          Generations
        </button>
        <button type="button" className={tab === 'saved' ? 'is-active' : undefined} onClick={() => setTab('saved')}>
          Saved
        </button>
      </div>

      <form className="lg-creative-sfx-dock" style={{ position: 'relative', bottom: 'auto', marginBottom: '1.25rem' }} onSubmit={onGenerate}>
        <div className="lg-creative-chips" style={{ marginBottom: '0.55rem' }}>
          {PROMPTS.map((p) => (
            <button key={p} type="button" onClick={() => setPrompt(p)}>
              {p}
            </button>
          ))}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Make an indie rock piece with jangly guitars…"
          aria-label="Music prompt"
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>
            {variations} variations · {duration} · ~1,800 credits (estimate)
          </span>
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            <span className="lg-creative-credits">
              {formatCredits(credits.remaining)} credits
            </span>
            <button type="submit" className="lg-creative-send" aria-label="Generate">
              <CreativeIcon name="music" width={16} height={16} />
            </button>
          </div>
        </div>
        {message ? <p className="lg-creative-note">{message}</p> : null}
      </form>

      {tab === 'marketplace' ? (
        <>
          <div className="lg-creative-sfx-cats" role="list">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="lg-creative-sfx-cat"
                style={{ background: c.bg }}
                onClick={() => setGenre(c.label)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="lg-creative-toolbar">
            <div className="lg-creative-chips">
              <button type="button" onClick={() => setGenre('Genre')}>Genre</button>
              <button type="button" onClick={() => setGenre('Instrument')}>Instrument</button>
              <button type="button" onClick={() => setGenre('Mood')}>Mood</button>
              {genre ? (
                <button type="button" onClick={() => setGenre(null)}>
                  Clear {genre}
                </button>
              ) : null}
            </div>
            <label className="lg-creative-field">
              <CreativeIcon name="search" width={16} height={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, genre or description."
                aria-label="Search music"
              />
            </label>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="lg-creative-sfx-row">
              <DemoPlayStopButton
                active={playingId === `music-${r.id}`}
                loading={loadingId === `music-${r.id}`}
                variant="icon"
                label="Play"
                stopLabel="Stop"
                ariaLabel={`Preview ${r.title}`}
                onStop={stop}
                onPlay={() => {
                  void play({
                    id: `music-${r.id}`,
                    text: `${r.title}. ${r.tags}. Lugemi creative reference audio.`,
                    voiceId: 'own:en-us-female',
                    label: r.title,
                  });
                }}
              />
              <div>
                <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{r.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>{r.tags}</div>
              </div>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{r.duration}</span>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.8rem' }}>Explore</span>
              <span />
            </div>
          ))}
        </>
      ) : null}

      {tab === 'generations' || tab === 'saved' ? (
        saved.length === 0 ? (
          <div className="lg-creative-empty">
            <strong>No saved prompts yet</strong>
            Queue a generation intent above — honest wiring until a music model ships.
          </div>
        ) : (
          saved.map((h) => (
            <div key={h.id} className="lg-creative-sfx-row">
              <span className="lg-creative-icon-btn" aria-hidden>
                <CreativeIcon name="music" />
              </span>
              <div>
                <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{h.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>{h.meta}</div>
              </div>
              <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>Intent</span>
              <Link href={`/creative/text-to-speech?text=${encodeURIComponent(h.name)}`} className="lg-creative-ghost">
                Speech instead
              </Link>
              <span />
            </div>
          ))
        )
      ) : null}
    </CreativeShell>
  );
}

export function CreativeMusicClient() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem' }}>Loading Music…</p>}>
      <MusicInner />
    </Suspense>
  );
}

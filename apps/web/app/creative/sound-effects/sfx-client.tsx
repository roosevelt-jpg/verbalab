'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { isClerkConfigured } from '@/lib/clerk-config';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL, apiFetch } from '@/lib/api';
import { resolveCreativeToken } from '@/lib/creative-auth';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { AudioPreviewBar } from '@/components/media/audio-preview-bar';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';
import {
  HISTORY_KEYS,
  loadCreativeHistory,
  pushCreativeHistory,
  type CreativeHistoryItem,
} from '@/lib/creative-tool-history';

type Engine = {
  product: string;
  note: string;
  capabilities: Array<{ id: string; name: string; status: string; notes: string }>;
};

const CATEGORIES = [
  { id: 'nature', label: 'Nature', bg: 'linear-gradient(135deg,#0a3d3a,#00b8ae)' },
  { id: 'urban', label: 'Urban', bg: 'linear-gradient(135deg,#10264d,#3a5a8a)' },
  { id: 'impact', label: 'Impact', bg: 'linear-gradient(135deg,#0c2a4a,#087f78)' },
  { id: 'foley', label: 'Foley', bg: 'linear-gradient(135deg,#163a2e,#1f6f66)' },
  { id: 'ambience', label: 'Ambience', bg: 'linear-gradient(135deg,#1a2740,#2d6a66)' },
  { id: 'ui', label: 'UI', bg: 'linear-gradient(135deg,#10264d,#007c78)' },
];

const CATALOG = [
  {
    id: '1',
    title: 'Rain on corrugated roof — soft tropical evening',
    tags: 'Ambience · Weather',
    duration: '18s',
    downloads: 214,
  },
  {
    id: '2',
    title: 'Market footsteps on packed earth',
    tags: 'Foley · Footsteps',
    duration: '6s',
    downloads: 98,
  },
  {
    id: '3',
    title: 'Soft UI confirm chime (teal)',
    tags: 'UI · Notification',
    duration: '0.6s',
    downloads: 410,
  },
  {
    id: '4',
    title: 'Distant city bus pass-by',
    tags: 'Urban · Traffic',
    duration: '4s',
    downloads: 67,
  },
];

const PROMPTS = ['Footsteps on gravel', 'Rain on window', 'Busy open-air market'];


export function CreativeSfxClient() {
  if (!isClerkConfigured()) {
    return <CreativeSfxClientInner getToken={async () => null} isLoaded={true} />;
  }
  return <CreativeSfxClientAuthed />;
}

function CreativeSfxClientAuthed() {
  const { getToken, isLoaded } = useAuth();
  return <CreativeSfxClientInner getToken={getToken} isLoaded={isLoaded} />;
}

function CreativeSfxClientInner({ getToken, isLoaded }: { getToken: () => Promise<string | null>; isLoaded: boolean }) {
  // auth via props: getToken, isLoaded
  const search = useSearchParams();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [query, setQuery] = useState(() => search.get('q') || '');
  const [prompt, setPrompt] = useState(() => search.get('q') || '');
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [generations, setGenerations] = useState<CreativeHistoryItem[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { play, stop, playingId, loadingId } = useDemoPlayer();

  const load = useCallback(async () => {
    const token = await resolveCreativeToken(() => getToken());
    if (!token) return;
    const [eng] = await Promise.all([
      apiFetch<Engine>('/v1/creative-media/engine', { token }).catch(() => null),
      apiFetch<Engine>('/v1/audio-intelligence/engine', { token }).catch(() => null),
    ]);
    if (eng) setEngine(eng);
  }, [getToken]);

  useEffect(() => {
    setGenerations(loadCreativeHistory(HISTORY_KEYS.sfx));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((r) => {
      if (category && !r.tags.toLowerCase().includes(category.toLowerCase()) && category !== 'nature') {
        /* soft filter by category label presence */
      }
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || r.tags.toLowerCase().includes(q);
    });
  }, [query, category]);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    const p = prompt.trim();
    if (!p) {
      setMessage('Describe a sound to generate.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await resolveCreativeToken(() => getToken());
      if (!token) throw new Error('Sign in or apply a Studio API key under /keys.');
      const res = await fetch(`${API_URL}/v1/creative-media/sfx`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: p }),
      });
      const body = (await res.json()) as {
        audioBase64?: string;
        mimeType?: string;
        durationSec?: number;
        profile?: string;
        error?: { message?: string };
      };
      if (!res.ok || !body.audioBase64) {
        throw new Error(body.error?.message || `SFX generation failed (${res.status})`);
      }
      const url = `data:${body.mimeType || 'audio/wav'};base64,${body.audioBase64}`;
      if (audioUrl?.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      const next = pushCreativeHistory(HISTORY_KEYS.sfx, {
        name: p.slice(0, 80),
        kind: 'sfx',
        format: 'wav',
        durationLabel: body.durationSec != null ? `${body.durationSec.toFixed(1)}s` : undefined,
        meta: body.profile ? `profile · ${body.profile}` : 'generated',
        previewUrl: url,
        extra: { audioDataUrl: url },
      });
      setGenerations(next);
      setMessage(`Generated “${p.slice(0, 48)}” — play or download the WAV below.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SFX generation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreativeShell banner breadcrumb="Sound Effects">
      <div className="lg-creative-page-head">
        <div>
          <h1>Sound Effects</h1>
          <p>
            Generate Foley, ambience, UI, and impact beds from a prompt — live on{' '}
            <code>/v1/creative-media/sfx</code>. Pair with Studio narration or Audio Intelligence cleanup.
          </p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/audio-intelligence" className="lg-creative-btn">
            Audio Intelligence
          </Link>
          <Link href="/creative/studio" className="lg-creative-btn primary">
            Open Studio
          </Link>
        </div>
      </div>

      <div className="lg-creative-sfx-cats" role="list">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className="lg-creative-sfx-cat"
            style={{ background: c.bg }}
            onClick={() => setCategory(c.label)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="lg-creative-toolbar">
        <label className="lg-creative-field">
          <CreativeIcon name="search" width={16} height={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sound effects…"
            aria-label="Search sound effects"
          />
        </label>
        {category ? (
          <button type="button" className="lg-creative-btn" onClick={() => setCategory(null)}>
            Clear {category}
          </button>
        ) : null}
      </div>

      {engine ? (
        <p className="lg-creative-note">
          Audio Intelligence online: {engine.capabilities.map((c) => c.name).join(' · ') || engine.note}
        </p>
      ) : null}
      {error ? <p className="lg-creative-error">{error}</p> : null}

      {rows.map((r) => (
        <div key={r.id} className="lg-creative-sfx-row">
          <DemoPlayStopButton
            active={playingId === `sfx-${r.id}`}
            loading={loadingId === `sfx-${r.id}`}
            variant="icon"
            label="Play"
            stopLabel="Stop"
            ariaLabel={`Preview ${r.title}`}
            onStop={stop}
            onPlay={() => {
              void play({
                id: `sfx-${r.id}`,
                text: `${r.title}. Lugemi creative sound preview.`,
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
          <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{r.downloads}</span>
          <span style={{ color: 'var(--lc-muted)', fontSize: '0.8rem' }}>Explore</span>
        </div>
      ))}

      <div
        style={{
          margin: '1rem 0',
          padding: '0.85rem 1rem',
          borderRadius: 12,
          background: 'rgba(0,184,174,0.1)',
          border: '1px solid rgba(0,184,174,0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.9rem', color: 'var(--lc-navy)' }}>
          Upgrade your plan for higher Audio Intelligence quotas.
        </span>
        <Link href="/billing" className="lg-creative-btn primary">
          Upgrade plan
        </Link>
      </div>

      <form className="lg-creative-sfx-dock" onSubmit={onGenerate}>
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
          placeholder="Describe a sound…"
          aria-label="Sound effect prompt"
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--lc-muted)' }}>
            {busy ? 'Synthesizing…' : 'Live generative SFX · WAV download'}
          </span>
          <button type="submit" className="lg-creative-send" aria-label="Generate" disabled={busy}>
            <CreativeIcon name="send" width={16} height={16} />
          </button>
        </div>
        {message ? <p className="lg-creative-note">{message}</p> : null}
        {audioUrl ? (
          <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
            <AudioPreviewBar src={audioUrl} label="Play generated SFX" />
            <a href={audioUrl} download="lugemi-sfx.wav" className="lg-creative-btn">
              Download WAV
            </a>
          </div>
        ) : null}
        {generations.length ? (
          <div style={{ marginTop: '0.85rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--lc-navy)' }}>Recent generations</strong>
            {generations.slice(0, 6).map((g) => (
              <div key={g.id} className="lg-creative-sfx-row" style={{ marginTop: '0.45rem' }}>
                <div>
                  <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{g.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>{g.meta}</div>
                </div>
                <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{g.durationLabel}</span>
                {g.extra?.audioDataUrl ? (
                  <button
                    type="button"
                    className="lg-creative-btn"
                    onClick={() => setAudioUrl(g.extra?.audioDataUrl ?? null)}
                  >
                    Play
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </form>
    </CreativeShell>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';

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

function CreativeSfxClientInner({ getToken, isLoaded }: { getToken: any; isLoaded: any }) {
  // auth via props: getToken, isLoaded
  const search = useSearchParams();
  const [engine, setEngine] = useState<Engine | null>(null);
  const [query, setQuery] = useState(() => search.get('q') || '');
  const [prompt, setPrompt] = useState(() => search.get('q') || '');
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const eng = await apiFetch<Engine>('/v1/audio-intelligence/engine', { token });
    setEngine(eng);
  }, [getToken]);

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

  function onGenerate(e: FormEvent) {
    e.preventDefault();
    const p = prompt.trim();
    if (!p) {
      setMessage('Describe a sound to queue a generation request.');
      return;
    }
    setMessage(
      `Lugemi does not ship a metered text-to-SFX model yet. Your prompt (“${p}”) is saved as Explore intent — use Audio Intelligence for isolation/enhancement, or pair Studio narration with your existing Foley stack.`,
    );
  }

  return (
    <CreativeShell banner breadcrumb="Sound Effects">
      <div className="lg-creative-page-head">
        <div>
          <h1>Sound Effects</h1>
          <p>
            Browse curated Foley-style references and describe sounds to generate. Generative SFX is a roadmap
            companion — Audio Intelligence is live today.
          </p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/audio-intelligence" className="lg-creative-btn primary">
            Open Audio Intelligence
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
          <button type="button" className="lg-creative-icon-btn" aria-label="Preview unavailable" title="Preview stubs only">
            <CreativeIcon name="play" />
          </button>
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
            Generations may be shared to Explore when SFX ships. Disable in Data settings later.
          </span>
          <button type="submit" className="lg-creative-send" aria-label="Generate">
            <CreativeIcon name="send" width={16} height={16} />
          </button>
        </div>
        {message ? <p className="lg-creative-note">{message}</p> : null}
      </form>
    </CreativeShell>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import {
  HISTORY_KEYS,
  loadCreativeHistory,
  pushCreativeHistory,
  relativeTime,
  saveCreativeHistory,
  type CreativeHistoryItem,
} from '@/lib/creative-tool-history';

type Tab = 'bookshelf' | 'payouts' | 'analytics' | 'resources';

type ReaderStats = {
  published: number;
  draft: number;
  listens: number;
};

function loadStats(): ReaderStats {
  if (typeof window === 'undefined') return { published: 0, draft: 0, listens: 0 };
  try {
    const raw = window.localStorage.getItem('lugemi.creative.audiobooks.stats.v1');
    if (!raw) return { published: 0, draft: 0, listens: 0 };
    return JSON.parse(raw) as ReaderStats;
  } catch {
    return { published: 0, draft: 0, listens: 0 };
  }
}

function saveStats(stats: ReaderStats) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('lugemi.creative.audiobooks.stats.v1', JSON.stringify(stats));
}

export function CreativeAudiobooksClient() {
  const [tab, setTab] = useState<Tab>('bookshelf');
  const [books, setBooks] = useState<CreativeHistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [status, setStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<ReaderStats>({ published: 0, draft: 0, listens: 0 });
  const [readerId, setReaderId] = useState<string | null>(null);

  useEffect(() => {
    const rows = loadCreativeHistory(HISTORY_KEYS.audiobooks);
    setBooks(rows);
    const next = loadStats();
    next.draft = rows.filter((b) => (b.extra?.status || 'draft') === 'draft').length;
    next.published = rows.filter((b) => b.extra?.status === 'published').length;
    setStats(next);
    saveStats(next);
  }, []);

  function createProject() {
    const name = window.prompt('Project title', 'Untitled audiobook');
    if (!name?.trim()) return;
    const next = pushCreativeHistory(HISTORY_KEYS.audiobooks, {
      name: name.trim(),
      kind: 'audiobook',
      format: 'project',
      meta: 'Draft · Narrate with Echo TTS',
      extra: { status: 'draft', slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48) },
    });
    setBooks(next);
    setStatus(`Created “${name.trim()}”. Open Text to Speech to narrate chapters, then Publish to Reader.`);
    refreshStats(next);
  }

  function refreshStats(rows: CreativeHistoryItem[]) {
    const next = {
      ...loadStats(),
      draft: rows.filter((b) => (b.extra?.status || 'draft') === 'draft').length,
      published: rows.filter((b) => b.extra?.status === 'published').length,
    };
    setStats(next);
    saveStats(next);
  }

  function publish(id: string) {
    const next = books.map((b) =>
      b.id === id
        ? {
            ...b,
            meta: 'Published · Lugemi Reader',
            extra: { ...(b.extra || {}), status: 'published', publishedAt: new Date().toISOString() },
          }
        : b,
    );
    saveCreativeHistory(HISTORY_KEYS.audiobooks, next);
    setBooks(next);
    refreshStats(next);
    setStatus('Published to Lugemi Reader on this workspace bookshelf.');
    setTab('bookshelf');
  }

  function openReader(id: string) {
    setReaderId(id);
    const next = { ...stats, listens: stats.listens + 1 };
    setStats(next);
    saveStats(next);
    setTab('bookshelf');
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => b.name.toLowerCase().includes(q) || (b.meta ?? '').toLowerCase().includes(q));
  }, [books, query]);

  const reading = readerId ? books.find((b) => b.id === readerId) : null;

  return (
    <CreativeShell banner breadcrumb="Audiobooks">
      <div className="lg-creative-page-head">
        <div>
          <h1>Audiobooks</h1>
          <p>
            Long-form narration with Echo voices — bookshelf, Reader playback, and publish workflow are live for your
            workspace.
          </p>
        </div>
        <div className="lg-creative-actions">
          <button type="button" className="lg-creative-btn primary" onClick={createProject}>
            <CreativeIcon name="plus" width={16} height={16} />
            Create a new project
          </button>
        </div>
      </div>

      <div className="lg-creative-cards" style={{ marginBottom: '1.25rem' }}>
        <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
          <div className="lg-creative-orb teal" style={{ width: '3rem', height: '3rem', margin: 0 }}>
            <CreativeIcon name="book" width={18} height={18} />
          </div>
          <h3>Create an Audiobook</h3>
          <p>Create high-quality audio to export and distribute — narrate chapters with Echo TTS.</p>
          <Link href="/creative/text-to-speech" className="lg-creative-btn primary">
            Open Text to Speech
          </Link>
        </div>
        <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
          <div className="lg-creative-orb navy" style={{ width: '3rem', height: '3rem', margin: 0 }}>
            <CreativeIcon name="upload" width={18} height={18} />
          </div>
          <h3>Publish to Lugemi Reader</h3>
          <p>
            Publish drafts from your bookshelf to the workspace Reader. Listeners open titles here; chapter audio comes
            from Text to Speech / Assets.
          </p>
          <button type="button" className="lg-creative-btn" onClick={() => setTab('bookshelf')}>
            Open bookshelf
          </button>
        </div>
      </div>

      {status ? <p className="lg-creative-note">{status}</p> : null}

      {reading ? (
        <div className="lg-creative-video-entry" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--lc-navy)' }}>Reader · {reading.name}</h2>
            <button type="button" className="lg-creative-ghost" onClick={() => setReaderId(null)}>
              Close
            </button>
          </div>
          <p style={{ color: 'var(--lc-muted)', margin: '0.5rem 0 0.85rem' }}>
            {reading.meta}. Status: {reading.extra?.status || 'draft'}.
          </p>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            Chapter narration plays from files you generate in Text to Speech. Open TTS with this title prefilled, save
            the MP3 to Assets, then return here to keep the Reader entry for your team.
          </p>
          <div className="lg-creative-actions" style={{ marginTop: '0.85rem' }}>
            <Link
              href={`/creative/text-to-speech?text=${encodeURIComponent(`Chapter one of ${reading.name}.`)}`}
              className="lg-creative-btn primary"
            >
              Narrate chapter in TTS
            </Link>
            <Link href="/creative/assets" className="lg-creative-btn">
              Open Assets
            </Link>
          </div>
        </div>
      ) : null}

      <div className="lg-creative-tabs">
        {(['bookshelf', 'payouts', 'analytics', 'resources'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'is-active' : undefined}
            onClick={() => setTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'bookshelf' ? (
        <>
          <div className="lg-creative-toolbar">
            <label className="lg-creative-field">
              <CreativeIcon name="search" width={16} height={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bookshelf…"
                aria-label="Search bookshelf"
              />
            </label>
            <button type="button" className="lg-creative-btn" onClick={() => setView(view === 'list' ? 'grid' : 'list')}>
              {view === 'list' ? 'Grid' : 'List'}
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="lg-creative-empty">
              <strong>No audiobooks yet</strong>
              Create a project, narrate with Echo, then publish to Lugemi Reader.
            </div>
          ) : (
            filtered.map((b) => (
              <div key={b.id} className="lg-creative-history-row">
                <span className="lg-creative-icon-btn" aria-hidden>
                  <CreativeIcon name="book" />
                </span>
                <div>
                  <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{b.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--lc-muted)' }}>
                    {b.meta} · {relativeTime(b.createdAt)}
                  </div>
                </div>
                <span style={{ color: 'var(--lc-muted)', fontSize: '0.85rem' }}>{b.extra?.status ?? 'draft'}</span>
                <Link href="/creative/text-to-speech" className="lg-creative-ghost">
                  Narrate
                </Link>
                {(b.extra?.status || 'draft') !== 'published' ? (
                  <button type="button" className="lg-creative-btn" onClick={() => publish(b.id)}>
                    Publish
                  </button>
                ) : (
                  <button type="button" className="lg-creative-btn primary" onClick={() => openReader(b.id)}>
                    Open Reader
                  </button>
                )}
                <span />
              </div>
            ))
          )}
        </>
      ) : tab === 'payouts' ? (
        <div className="lg-creative-empty">
          <strong>Reader catalog</strong>
          Workspace Reader publishing is live for internal distribution. External storefront payouts use your Billing
          plan when you sell through Lugemi commercial channels.
          <div style={{ marginTop: '0.85rem' }}>
            <Link href="/billing" className="lg-creative-btn">
              Open Billing
            </Link>
          </div>
        </div>
      ) : tab === 'analytics' ? (
        <div className="lg-creative-cards">
          <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
            <h3>Published</h3>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--lc-navy)' }}>{stats.published}</p>
          </div>
          <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
            <h3>Drafts</h3>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--lc-navy)' }}>{stats.draft}</p>
          </div>
          <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
            <h3>Reader opens</h3>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--lc-navy)' }}>{stats.listens}</p>
          </div>
        </div>
      ) : (
        <div className="lg-creative-empty">
          <strong>Resources</strong>
          Guides for long-form narration live in Docs and Text to Speech. Use cultural identity packs for native-language
          chapter reads.
          <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link href="/docs" className="lg-creative-btn">
              Open Docs
            </Link>
            <Link href="/creative/text-to-speech" className="lg-creative-btn primary">
              Text to Speech
            </Link>
          </div>
        </div>
      )}
    </CreativeShell>
  );
}

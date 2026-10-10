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
  type CreativeHistoryItem,
} from '@/lib/creative-tool-history';

type Tab = 'bookshelf' | 'payouts' | 'analytics' | 'resources';

export function CreativeAudiobooksClient() {
  const [tab, setTab] = useState<Tab>('bookshelf');
  const [books, setBooks] = useState<CreativeHistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setBooks(loadCreativeHistory(HISTORY_KEYS.audiobooks));
  }, []);

  function createProject() {
    const name = window.prompt('Project title', 'Untitled audiobook');
    if (!name?.trim()) return;
    const next = pushCreativeHistory(HISTORY_KEYS.audiobooks, {
      name: name.trim(),
      kind: 'audiobook',
      format: 'project',
      meta: 'Draft · Narrate with Echo TTS',
      extra: { status: 'draft' },
    });
    setBooks(next);
    setStatus(`Created “${name.trim()}”. Open Text to Speech to narrate chapters.`);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => b.name.toLowerCase().includes(q) || (b.meta ?? '').toLowerCase().includes(q));
  }, [books, query]);

  return (
    <CreativeShell banner breadcrumb="Audiobooks">
      <div className="lg-creative-page-head">
        <div>
          <h1>Audiobooks</h1>
          <p>Long-form narration projects with Echo voices — bookshelf locally, chapters via Text to Speech.</p>
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
          <p>Create high-quality audio to export and distribute everywhere — narrate chapters with Echo TTS.</p>
          <Link href="/creative/text-to-speech" className="lg-creative-btn primary">
            Open Text to Speech
          </Link>
        </div>
        <div className="lg-creative-card" style={{ minHeight: 'auto' }}>
          <div className="lg-creative-orb navy" style={{ width: '3rem', height: '3rem', margin: 0 }}>
            <CreativeIcon name="upload" width={18} height={18} />
          </div>
          <h3>Publish to Lugemi Reader</h3>
          <p>Upload chapter audio to Assets and prepare distribution — Reader marketplace wiring is roadmap.</p>
          <Link href="/creative/assets" className="lg-creative-btn">
            Open Assets
          </Link>
        </div>
      </div>

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
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 10,
              background: 'rgba(0,184,174,0.1)',
              border: '1px solid rgba(0,184,174,0.22)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--lc-navy)' }}>
              Character casting — narrate with Echo voices for every chapter in minutes.
            </span>
            <Link href="/creative/voices" className="lg-creative-btn primary">
              Try now
            </Link>
          </div>

          <div className="lg-creative-toolbar">
            <label className="lg-creative-field">
              <CreativeIcon name="search" width={16} height={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search books and series…"
                aria-label="Search bookshelf"
              />
            </label>
            <div className="lg-creative-chips">
              <button type="button">+ Type</button>
              <button type="button">+ Status</button>
              <button type="button">+ Language</button>
            </div>
            <button
              type="button"
              className="lg-creative-icon-btn"
              aria-label="Grid view"
              onClick={() => setView('grid')}
            >
              <CreativeIcon name="grid" />
            </button>
            <button
              type="button"
              className="lg-creative-icon-btn"
              aria-label="List view"
              onClick={() => setView('list')}
            >
              <CreativeIcon name="list" />
            </button>
          </div>

          {status ? <p className="lg-creative-note">{status}</p> : null}

          {filtered.length === 0 ? (
            <div className="lg-creative-empty">
              <CreativeIcon name="book" width={36} height={36} />
              <strong>No books found</strong>
              Create a project to start your bookshelf on this device.
            </div>
          ) : view === 'grid' ? (
            <div className="lg-creative-cards">
              {filtered.map((b) => (
                <div key={b.id} className="lg-creative-card" style={{ minHeight: 'auto' }}>
                  <h3>{b.name}</h3>
                  <p>{b.meta}</p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--lc-muted)' }}>{relativeTime(b.createdAt)}</span>
                  <Link
                    href={`/creative/text-to-speech?text=${encodeURIComponent(`Chapter 1 — ${b.name}`)}`}
                    className="lg-creative-btn primary"
                  >
                    Narrate
                  </Link>
                </div>
              ))}
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
                <span />
                <span />
              </div>
            ))
          )}
        </>
      ) : (
        <div className="lg-creative-empty">
          <strong>{tab.charAt(0).toUpperCase() + tab.slice(1)}</strong>
          {tab === 'payouts'
            ? 'Reader payouts are not live yet — keep projects on your bookshelf.'
            : tab === 'analytics'
              ? 'Audiobook analytics will surface chapter completion when Reader ships.'
              : 'Guides for long-form narration live in Docs and Text to Speech.'}
          <div style={{ marginTop: '0.85rem' }}>
            <Link href="/docs" className="lg-creative-btn">
              Open Docs
            </Link>
          </div>
        </div>
      )}
    </CreativeShell>
  );
}

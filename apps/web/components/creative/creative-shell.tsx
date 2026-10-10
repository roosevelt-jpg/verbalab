'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import {
  CREATIVE_PINNED,
  CREATIVE_PRIMARY,
  CREATIVE_SEARCH_INDEX,
  creativeTitleForPath,
} from '@/lib/creative-nav';
import { CreativeIcon } from './creative-icons';
import './creative.css';

function isActive(pathname: string, href: string) {
  if (href === '/creative') return pathname === '/creative';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CreativeShell({
  children,
  breadcrumb,
  banner,
}: {
  children: ReactNode;
  breadcrumb?: string;
  banner?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 960px)');
    const apply = () => {
      setIsMobile(mq.matches);
      setSidebarOpen(!mq.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setQuery('');
        setActiveIdx(0);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CREATIVE_SEARCH_INDEX.slice(0, 12);
    return CREATIVE_SEARCH_INDEX.filter(
      (r) => r.label.toLowerCase().includes(q) || r.hint.toLowerCase().includes(q),
    ).slice(0, 12);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setSearchOpen(false);
      router.push(href);
    },
    [router],
  );

  const title = breadcrumb ?? creativeTitleForPath(pathname);

  return (
    <div className="lg-creative">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {banner && bannerOpen ? (
          <div className="lg-creative-banner" role="status">
            <span>
              Echo voice models are live — region-aware speech for LugemiCreative.{' '}
              <Link href="/baobab">Try Baobab</Link>
            </span>
            <button type="button" aria-label="Dismiss banner" onClick={() => setBannerOpen(false)}>
              <CreativeIcon name="close" width={16} height={16} />
            </button>
          </div>
        ) : null}

        <div className="lg-creative-frame">
          <aside
            className={`lg-creative-sidebar${sidebarOpen ? '' : ' is-collapsed'}`}
            aria-label="LugemiCreative navigation"
          >
            <Link href="/creative" className="lg-creative-brand">
              <img src="/brand/lugemi-symbol-teal.svg" alt="" width={28} height={31} />
              Lugemi
            </Link>

            <nav className="lg-creative-nav" aria-label="Primary">
              {CREATIVE_PRIMARY.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(pathname, item.href) ? 'is-active' : undefined}
                  onClick={() => {
                    if (isMobile) setSidebarOpen(false);
                  }}
                >
                  <CreativeIcon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="lg-creative-pinned-label">Pinned</div>
            <nav className="lg-creative-nav" aria-label="Pinned tools">
              {CREATIVE_PINNED.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(pathname, item.href) ? 'is-active' : undefined}
                  onClick={() => {
                    if (isMobile) setSidebarOpen(false);
                  }}
                >
                  <CreativeIcon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="lg-creative-sidebar-foot">
              <Link href="/dashboard" className="lg-creative-switcher" title="Open LugemiAgents / platform ops">
                <span className="lg-creative-switcher-mark" aria-hidden />
                LugemiCreative
              </Link>
              <p style={{ margin: '0.45rem 0.5rem 0', fontSize: '0.72rem', color: 'var(--lc-muted)' }}>
                Switch to platform ops or{' '}
                <Link href="/chat" style={{ color: 'var(--lc-action)', fontWeight: 650 }}>
                  LugemiAgents
                </Link>
              </p>
            </div>
          </aside>

          {sidebarOpen && isMobile ? (
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 45,
                border: 0,
                background: 'rgba(16,38,77,0.25)',
                cursor: 'pointer',
              }}
            />
          ) : null}

          <div className="lg-creative-main">
            <header className="lg-creative-top">
              <div className="lg-creative-crumb">
                <button
                  type="button"
                  className="lg-creative-icon-btn"
                  aria-label={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  <CreativeIcon name="sidebar" />
                </button>
                <span>{title}</span>
              </div>

              <button
                type="button"
                className="lg-creative-search"
                onClick={() => {
                  setSearchOpen(true);
                  setQuery('');
                  setActiveIdx(0);
                }}
              >
                <CreativeIcon name="search" width={16} height={16} />
                <span>Search everything...</span>
                <kbd>⌘ K</kbd>
              </button>

              <div className="lg-creative-top-actions">
                <Link href="/docs" className="lg-creative-ghost">
                  Docs
                </Link>
                <a href="mailto:hello@lugemi.com?subject=LugemiCreative%20feedback" className="lg-creative-ghost">
                  Feedback
                </a>
                <Link href="/creative/chat" className="lg-creative-ask">
                  <span className="lg-creative-ask-dot" aria-hidden />
                  Ask
                </Link>
                <Link href="/creative/assets" className="lg-creative-icon-btn" aria-label="Assets">
                  <CreativeIcon name="folder" />
                </Link>
                <span className="lg-creative-icon-btn" aria-hidden>
                  <CreativeIcon name="bell" />
                </span>
                {isClerkConfigured() ? (
                  <SignedIn>
                    <UserButton afterSignOutUrl="/" />
                  </SignedIn>
                ) : null}
              </div>
            </header>

            <div className="lg-creative-content">{children}</div>
          </div>
        </div>
      </div>

      {searchOpen ? (
        <div
          className="lg-creative-palette"
          role="dialog"
          aria-modal="true"
          aria-label="Search LugemiCreative"
          onClick={() => setSearchOpen(false)}
        >
          <div className="lg-creative-palette-panel" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={query}
              placeholder="Search tools, surfaces, docs…"
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter' && results[activeIdx]) {
                  e.preventDefault();
                  go(results[activeIdx].href);
                }
              }}
            />
            <div className="lg-creative-palette-list">
              {results.length === 0 ? (
                <p style={{ padding: '1rem', color: 'var(--lc-muted)', margin: 0 }}>No matches.</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.href}-${r.label}`}
                    type="button"
                    className={i === activeIdx ? 'is-active' : undefined}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => go(r.href)}
                  >
                    {r.label}
                    <span>{r.hint}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

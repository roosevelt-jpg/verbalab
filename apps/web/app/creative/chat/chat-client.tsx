'use client';

import Link from 'next/link';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';

const SUGGESTIONS = [
  {
    title: 'Product launch voiceover',
    body: 'Write and produce a clear, professional voiceover for a product launch.',
    href: '/creative/text-to-speech?text=Write%20a%20product%20launch%20voiceover',
  },
  {
    title: 'Podcast intro music',
    body: 'Compose a distinctive intro theme for a podcast or show.',
    href: '/creative/music?q=podcast%20intro',
  },
  {
    title: 'Images for a blog post',
    body: 'Create polished images to accompany an article or blog post.',
    href: '/creative/image-video',
  },
];

export function CreativeChatClient() {
  return (
    <CreativeShell banner breadcrumb="Chat">
      <div className="lg-creative-page-head">
        <div>
          <h1>
            Chat <span className="lg-creative-alpha">Alpha</span>
          </h1>
          <p>
            Creative chat stays light here. For full translate-and-speak immersive Chat Studio, open LugemiAgents.
          </p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/chat" className="lg-creative-btn primary">
            Open Chat Studio immersive
          </Link>
        </div>
      </div>

      <section className="lg-creative-hero" style={{ marginTop: '1.5rem' }}>
        <h1>What would you like to create?</h1>
        <Link href="/chat" className="lg-creative-prompt" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="lg-creative-prompt-orb" aria-hidden />
          <span className="lg-creative-icon-btn" aria-hidden>
            <CreativeIcon name="plus" />
          </span>
          <span style={{ flex: 1, color: 'var(--lc-muted)', textAlign: 'left' }}>Make a podcast intro with music...</span>
          <span className="lg-creative-alpha">Alpha</span>
          <span className="lg-creative-send" aria-hidden>
            <CreativeIcon name="send" width={16} height={16} />
          </span>
        </Link>
      </section>

      <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--lc-muted)', fontWeight: 650 }}>
        Suggestions
      </h2>
      <div className="lg-creative-cards">
        {SUGGESTIONS.map((s) => (
          <Link key={s.title} href={s.href} className="lg-creative-card" style={{ textDecoration: 'none', minHeight: '8rem' }}>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </Link>
        ))}
      </div>

      <p className="lg-creative-note">
        Chat Studio immersive includes conversation history, speech playback, connectors, and document upload under{' '}
        <Link href="/chat" style={{ color: 'var(--lc-action)', fontWeight: 650 }}>
          /chat
        </Link>
        .
      </p>
    </CreativeShell>
  );
}

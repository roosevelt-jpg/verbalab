'use client';

import Link from 'next/link';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';
import { CREATIVE_PINNED, CREATIVE_PRIMARY } from '@/lib/creative-nav';

const EXTRA = [
  { href: '/baobab', label: 'Baobab', hint: 'Next model canopy' },
  { href: '/neural-tts', label: 'Neural TTS console', hint: 'Platform TTS' },
  { href: '/voice-cloning', label: 'Voice cloning console', hint: 'Consent-gated clones' },
  { href: '/audio-intelligence', label: 'Audio Intelligence', hint: 'Isolate & enhance' },
  { href: '/workflows', label: 'Workflows console', hint: 'JSON flows' },
  { href: '/chat', label: 'Chat Studio immersive', hint: 'LugemiAgents' },
  { href: '/billing', label: 'Billing', hint: 'Plans & quotas' },
  { href: '/dashboard', label: 'Platform ops', hint: 'Operator dashboard' },
];

export default function CreativeMorePage() {
  return (
    <CreativeShell banner breadcrumb="More tools">
      <div className="lg-creative-page-head">
        <div>
          <h1>More tools</h1>
          <p>Everything in LugemiCreative plus deep links into platform consoles.</p>
        </div>
      </div>

      <h2 style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', color: 'var(--lc-muted)', fontWeight: 700 }}>
        Workspace
      </h2>
      <div className="lg-creative-voice-grid" style={{ marginBottom: '1.5rem' }}>
        {[...CREATIVE_PRIMARY, ...CREATIVE_PINNED.filter((i) => i.href !== '/creative/more')].map((i) => (
          <Link key={i.href} href={i.href} className="lg-creative-voice-card" style={{ textDecoration: 'none' }}>
            <div className="lg-creative-voice-avatar" style={{ background: 'rgba(0,184,174,0.15)', color: 'var(--lc-navy)' }}>
              <CreativeIcon name={i.icon} />
            </div>
            <div>
              <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{i.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>LugemiCreative</div>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', color: 'var(--lc-muted)', fontWeight: 700 }}>
        Platform deep links
      </h2>
      <div className="lg-creative-voice-grid">
        {EXTRA.map((i) => (
          <Link key={i.href} href={i.href} className="lg-creative-voice-card" style={{ textDecoration: 'none' }}>
            <div className="lg-creative-voice-avatar">{i.label.slice(0, 1)}</div>
            <div>
              <div style={{ fontWeight: 650, color: 'var(--lc-navy)' }}>{i.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--lc-muted)' }}>{i.hint}</div>
            </div>
          </Link>
        ))}
      </div>
    </CreativeShell>
  );
}

'use client';

import Link from 'next/link';
import { CreativeShell } from '@/components/creative/creative-shell';
import { CreativeIcon } from '@/components/creative/creative-icons';

const CARDS = [
  {
    title: 'Instant Voice Clone',
    body: 'Clone from a short consent-attested sample — typically around 10 seconds. Best results with a few minutes of clean speech.',
    orb: 'teal',
    href: '/voice-cloning',
    cta: 'Create new',
    primary: true,
    arc: 'Min 10 sec · Best 3 min',
  },
  {
    title: 'Professional Voice Clone',
    body: 'Higher-fidelity enrollment with ownership attestation and abuse review. Plan for 30+ minutes of source audio.',
    orb: 'navy',
    href: '/voice-cloning',
    cta: 'Create new',
    primary: false,
    arc: 'Min 10 min · Best 2 hrs',
  },
  {
    title: 'Voice Design',
    body: 'Describe the voice you need — age, accent corridor, and delivery — then refine in the marketplace and studio.',
    orb: 'mix',
    href: '/creative/voices',
    cta: 'Create new',
    primary: false,
    arc: 'Prompt → Explore voices',
  },
] as const;

export function CreativeVoiceCreationClient() {
  return (
    <CreativeShell banner breadcrumb="Voice Creation">
      <div className="lg-creative-page-head">
        <div>
          <h1>Voice Creation</h1>
          <p>Instant clones, professional enrollment, and voice design — wired to Lugemi consent-gated cloning.</p>
        </div>
        <div className="lg-creative-actions">
          <Link href="/voice-cloning" className="lg-creative-btn primary">
            Open cloning console
          </Link>
        </div>
      </div>

      <div className="lg-creative-cards">
        {CARDS.map((c) => (
          <article key={c.title} className="lg-creative-card">
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <div className={`lg-creative-orb ${c.orb}`}>
              <CreativeIcon name="play" width={22} height={22} />
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--lc-muted)', margin: 0 }}>{c.arc}</p>
            <Link href={c.href} className={`lg-creative-btn${c.primary ? ' primary' : ''}`} style={{ justifyContent: 'center' }}>
              {c.cta}
            </Link>
          </article>
        ))}
      </div>

      <section
        style={{
          marginTop: '1.25rem',
          border: '1px solid var(--lc-line)',
          borderRadius: 14,
          padding: '1.15rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--lc-navy)' }}>Voice remixing</h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--lc-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Remix tone and pacing from an existing clone in the cloning console. Prompt example: “Create a warmer,
            slower delivery of this voice.”
          </p>
        </div>
        <Link href="/voice-cloning" className="lg-creative-btn">
          Create new
        </Link>
      </section>
    </CreativeShell>
  );
}

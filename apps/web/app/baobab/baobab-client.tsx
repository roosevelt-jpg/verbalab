'use client';

import Link from 'next/link';
import { BaobabPlane } from '@/components/marketing/baobab-plane';
import { ANAMORPHIC_STILLS } from '@/lib/anamorphic-stills';
import '@/components/marketing/baobab.css';

const ENGINES = [
  {
    id: 'mix',
    name: 'Lugemi Mix',
    family: 'Echo · Baobab · Translate · Voice',
    body: 'Joint mixed-language transcription and translation with language-switch spans and protected entities — code-switching as a first-class signal.',
    href: '/mix',
  },
  {
    id: 'fidelity',
    name: 'Lugemi Fidelity',
    family: 'Translate · Reason · Trust',
    body: 'Meaning-ledger verification with accept, retry, clarify, or review. Clarification never turns refusal into consent.',
    href: '/fidelity',
  },
  {
    id: 'live',
    name: 'Lugemi Live',
    family: 'Echo · Translate · Voice',
    body: 'Incremental interpretation with provisional, committed, and spoken states — audible repair without rewriting what already left the mouth.',
    href: '/live',
  },
  {
    id: 'edge',
    name: 'Lugemi Edge',
    family: 'Edge · Echo · Translate · Voice',
    body: 'Verified offline corridor packs with local, cloud_allowed, and cloud_forbidden modes. No silent cloud fallback.',
    href: '/edge',
  },
  {
    id: 'grounded',
    name: 'Lugemi Grounded',
    family: 'Fusion · Vision · Vector · Translate',
    body: 'Speech plus selected visual referent. Document evidence, speaker claim, and translation stay separate — assistive clarity only.',
    href: '/grounded',
  },
  {
    id: 'atlas',
    name: 'Lugemi Atlas',
    family: 'Reason · Dialect · Culture',
    body: 'Multilingual reasoning for dense dialect, culture, and vertical tasks — the mind that holds context across corridors.',
    href: '/chat',
  },
  {
    id: 'baobab',
    name: 'Lugemi Baobab',
    family: 'Translate · MT · Africa-first',
    body: 'Africa-first machine translation for long-context and dialect-aware pairs. Meaning roots before fluency theatre.',
    href: '/translate',
  },
  {
    id: 'echo',
    name: 'Lugemi Echo',
    family: 'Voice · Speech · Accents',
    body: 'First-party TTS and ASR for African accents and speaking agents — own:* voices on the same /v1 surface.',
    href: '/audio',
  },
] as const;

const CTA = [
  { label: 'Chat Studio', href: '/chat', primary: true },
  { label: 'Translate', href: '/translate' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Enterprise', href: '/enterprise' },
  { label: 'MCP', href: '/developers#mcp' },
] as const;

export function BaobabClient({ brandName }: { brandName: string }) {
  return (
    <div className="baobab-page">
      <section className="baobab-hero" aria-labelledby="baobab-brand">
        <div className="baobab-hero__visual">
          <BaobabPlane />
        </div>
        <div className="baobab-hero__veil" aria-hidden />
        <div className="baobab-hero__copy">
          <h1 id="baobab-brand" className="baobab-brand">
            <span>{brandName}</span>
            Baobab
          </h1>
          <p className="baobab-headline">Meaning-rooted language intelligence under one canopy.</p>
          <p className="baobab-lead">
            Eight engines in depth — Mix, Fidelity, Live, Edge, Grounded, Atlas, Baobab, Echo —
            for Africa-first corridors where code-switching, accent, and cultural context are the
            product, not an afterthought.
          </p>
          <div className="baobab-cta">
            {CTA.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={'primary' in c && c.primary ? 'baobab-cta__primary' : 'baobab-cta__ghost'}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="baobab-section" aria-labelledby="baobab-portfolio">
        <div className="baobab-wrap">
          <p className="baobab-kicker">Next-model portfolio</p>
          <h2 id="baobab-portfolio" className="baobab-h2">
            Verified Interpreter, grown as a canopy.
          </h2>
          <p className="baobab-lede">
            Not a single emotive voice drop — a living stack for mixed-language speech, fidelity
            checks, live repair, edge packs, and grounded interpretation across African corridors.
          </p>
          <div className="baobab-engine-grid">
            {ENGINES.map((eng) => (
              <Link key={eng.id} href={eng.href} className="baobab-engine">
                <p className="baobab-engine__family">{eng.family}</p>
                <h3 className="baobab-engine__name">{eng.name}</h3>
                <p className="baobab-engine__body">{eng.body}</p>
                <span className="baobab-engine__go">Open console →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="baobab-section baobab-section--mist" aria-labelledby="baobab-anamorphic">
        <div className="baobab-wrap baobab-split">
          <div>
            <p className="baobab-kicker">Anamorphic depth</p>
            <h2 id="baobab-anamorphic" className="baobab-h2">
              Tilt the canopy. Watch meaning hold.
            </h2>
            <p className="baobab-lede">
              The hero plane is a foreshortened mesh in Lugemi navy and teal — pointer-driven
              perspective that makes every engine feel dimensional. Built with CSS depth and a live
              canvas warp, not borrowed launch assets.
            </p>
            <ul className="baobab-list">
              <li>
                <strong>Accent Identity</strong>
                <span>
                  Accents and dialects stay first-class signals through Echo and Accent Intelligence —
                  not flattened into a generic global voice.
                </span>
              </li>
              <li>
                <strong>Verified Interpreter</strong>
                <span>
                  Mix + Fidelity + Live as one offering: transcribe switches, verify meaning, speak
                  with repair you can hear.
                </span>
              </li>
              <li>
                <strong>Africa-first corridors</strong>
                <span>
                  Country packs and evaluated varieties publish honest coverage — catalog membership
                  is not a quality certificate.
                </span>
              </li>
            </ul>
          </div>
          <div className="baobab-depth" aria-hidden>
            <img className="baobab-depth-canvas" src={ANAMORPHIC_STILLS.hero} alt="" />
            <div className="baobab-depth__layer baobab-depth__layer--a" />
            <div className="baobab-depth__layer baobab-depth__layer--b" />
            <div className="baobab-depth__layer baobab-depth__layer--c" />
          </div>
        </div>
      </section>

      <section className="baobab-band" aria-labelledby="baobab-ship">
        <div className="baobab-wrap">
          <h2 id="baobab-ship" className="baobab-h2">
            Ship under the canopy.
          </h2>
          <p className="baobab-lede">
            Open Chat Studio, run Translate, review Pricing, talk Enterprise, or wire MCP for
            agent and video voice — same first-party keys, same Lugemi surface.
          </p>
          <div className="baobab-cta">
            {CTA.map((c) => (
              <Link
                key={`band-${c.href}`}
                href={c.href}
                className={'primary' in c && c.primary ? 'baobab-cta__primary' : 'baobab-cta__ghost'}
              >
                {c.label}
              </Link>
            ))}
            <Link href="/verified-interpreter" className="baobab-cta__ghost">
              Verified Interpreter
            </Link>
            <Link href="/models" className="baobab-cta__ghost">
              Models
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { SITE_CONTENT } from '@/data/site-content';
import { HeroTtsCard } from './hero-tts-card';
import { LanguageBar } from './language-bar';
import { MarketingNav } from './nav';
import './marketing.css';

const SDK_SAMPLE = SITE_CONTENT.apiSnippets.speech;

const PRODUCTS = [
  {
    id: 'voice',
    tag: 'Text-to-speech',
    name: 'Lugemi Voice',
    body: 'Resonant, region-aware speech and consent-gated cloning — the sound layer for creative work and speaking agents.',
    href: '/audio',
    art: 'voice' as const,
  },
  {
    id: 'speech',
    tag: 'Speech-to-text',
    name: 'Lugemi Speech',
    body: 'Transcribe accents, dialects, and code-switching with research intelligence built for African and global languages.',
    href: '/speech',
    art: 'speech' as const,
  },
  {
    id: 'translate',
    tag: 'Translation',
    name: 'Lugemi Translate',
    body: 'Move meaning across languages without flattening cultural nuance — registry-backed, reviewable, and metered.',
    href: '/translate',
    art: 'translate' as const,
  },
];

const USE_CASES = [
  {
    title: 'Trade & negotiations',
    body: 'Close deals in the languages partners actually speak — with tone that holds trust.',
    tone: 'gold',
    art: 'agents' as const,
  },
  {
    title: 'Education',
    body: 'Teach and tutor across mother tongues so literacy and STEM travel further.',
    tone: 'blue',
    art: 'speech' as const,
  },
  {
    title: 'Sales & marketing',
    body: 'Localize campaigns and product voice without flattening cultural nuance.',
    tone: 'rose',
    art: 'translate' as const,
  },
  {
    title: 'Public speech',
    body: 'Civic address, broadcast, and advocacy that sound native, not dubbed.',
    tone: 'teal',
    art: 'voice' as const,
  },
  {
    title: 'Customer experience',
    body: 'Support and IVR that understand accents, switches, and regional phrasing.',
    tone: 'green',
    art: 'agents' as const,
  },
  {
    title: 'Creative voice',
    body: 'Agencies and creators ship narration, ads, and character voices at production pace.',
    tone: 'violet',
    art: 'api' as const,
  },
] as const;

const SHIP_WAYS = [
  {
    title: 'Creative',
    body: 'Lugemi Studio for scripts, voices, localization, and review before publish.',
    tags: ['TTS', 'STT', 'Films', 'Ads', 'Clone'],
    href: '/sign-up',
  },
  {
    title: 'Agents',
    body: 'First-party speaking agents that listen, reason, and reply aloud with cultural context.',
    tags: ['Voice agents', 'Support', 'Hotlines', 'FAQ'],
    href: '/voice',
  },
  {
    title: 'API',
    body: 'Ship with @lugemi/sdk, Bearer lg_live_ keys, and metered speech + translate endpoints.',
    tags: ['TTS', 'STT', 'SDK', 'Web', 'REST'],
    href: '/docs',
  },
] as const;

const CREATIVE_FEATURES = [
  { title: 'Script studio', body: 'Draft, localize, and review narration before it ships.' },
  { title: 'Voice library', body: 'Region-aware own:* voices with synthetic disclosure.' },
  { title: 'Consent clones', body: 'Authorization-gated cloning with review and disable paths.' },
  { title: 'Language chips', body: 'Pick registry languages per take — availability stays honest.' },
] as const;

const AGENT_FEATURES = [
  { title: 'Voice FAQ', body: 'STT → model → TTS turns for support and civic desks.' },
  { title: 'Cultural context', body: 'Country, ethnic, and accent metadata on every agent.' },
  { title: 'Simulate API', body: 'POST /v1/voice/simulate for sandbox speaking turns.' },
  { title: 'Inbound hooks', body: 'Twilio-ready paths for hotlines and call flows.' },
] as const;

const API_TABS = [
  { id: 'speech', label: 'Speech', href: '/docs' },
  { id: 'transcribe', label: 'Transcribe', href: '/docs' },
  { id: 'playground', label: 'Playground', href: '/playground' },
  { id: 'rest', label: 'REST', href: '/docs' },
] as const;

const IMPACT = [
  {
    title: 'Language sovereignty',
    body: 'First-party models and a public coverage matrix — African languages and ethnic varieties across every country are the investment priority, not an afterthought locale pack.',
  },
  {
    title: 'Freedom of priority',
    body: 'Ship for Africa first, then expand into LATAM, Southeast Asia, the Middle East, and the EU with the same API surface.',
  },
  {
    title: 'Digital infrastructure',
    body: 'Registry, metering, workspaces, and review controls so speech and translation can run as production infrastructure.',
  },
] as const;

const TIMELINE = [
  { year: '2023', title: 'African Language Registry', body: 'Seed languages, scripts, and task metadata for honest coverage claims.' },
  { year: '2024', title: 'Cultural intelligence', body: 'Dialect and accent metadata wired into speech and translation review paths.' },
  { year: '2025', title: 'First-party voice', body: 'own:* voices and API keys as the intended production route — not a wrapper stack.' },
  { year: 'Now', title: 'Lugemi platform', body: 'Studio, Agents, and API on one foundation with published per-task availability.' },
] as const;

const SAFETY = [
  { title: 'Moderation', body: 'Policy checks on generative speech paths so misuse surfaces before scale.' },
  { title: 'Accountability', body: 'Workspace keys, usage logs, and review states for clones and translations.' },
  { title: 'Provenance', body: 'Synthetic-speech disclosure and watermarking on clone voices where required.' },
  { title: 'Biometrics', body: 'Consent gates for voice cloning — authorization is required, not assumed.' },
] as const;

const UPDATES = [
  { title: 'Public language coverage', body: 'A coverage page lands so homepage CTAs point at real availability, not slogans.' },
  { title: 'First-party positioning', body: 'Product copy states Lugemi owns the API and models — not Google, OpenAI, or ElevenLabs wrappers.' },
  { title: 'Speaking agents', body: 'Developers ship agents that talk across languages, accents, and cultural contexts from one foundation.' },
] as const;

export function MarketingHome() {
  return (
    <div className="mkt">
      <a className="mkt-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav />
      <main id="main">
        <section className="mkt-hero" aria-labelledby="mkt-hero-title">
          <div className="mkt-wrap mkt-hero-grid">
            <div className="mkt-hero-copy">
              <p className="mkt-eyebrow">{SITE_CONTENT.hero.eyebrow}</p>
              <h1 id="mkt-hero-title">
                <span className="mkt-brand-hero">{SITE_CONTENT.hero.brand}</span>
                <span className="mkt-tagline">{SITE_CONTENT.hero.headline}</span>
              </h1>
              <p className="mkt-hero-lead">{SITE_CONTENT.hero.lead}</p>
              <div className="mkt-cta-row">
                <Link href={SITE_CONTENT.hero.primaryCta.href} className="vl-btn vl-btn-primary">
                  {SITE_CONTENT.hero.primaryCta.label}
                </Link>
                <Link href={SITE_CONTENT.hero.secondaryCta.href} className="vl-btn vl-btn-secondary">
                  {SITE_CONTENT.hero.secondaryCta.label}
                </Link>
              </div>
            </div>
            <HeroTtsCard />
          </div>
        </section>

        <LanguageBar />

        <section className="mkt-section" id="products" aria-labelledby="mkt-products-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Products</p>
            <h2 className="mkt-h2" id="mkt-products-title">
              One platform for African voice, speech, and language.
            </h2>
            <p className="mkt-lede">
              Voice, speech, and translation on the same first-party foundation — the stack developers use to ship
              speaking agents with cultural context. Availability follows the published coverage matrix.
            </p>
            <div className="mkt-card-grid-3">
              {PRODUCTS.map((product) => (
                <article key={product.id} className="mkt-product-card">
                  <AnamorphicPanel variant={product.art} size="sm" label={product.name} className="mkt-product-media" />
                  <p className="mkt-product-tag">{product.tag}</p>
                  <h3>{product.name}</h3>
                  <p>{product.body}</p>
                  <Link href={product.href} className="mkt-text-link">
                    Explore →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="use-cases" aria-labelledby="mkt-usecases-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Use cases</p>
            <h2 className="mkt-h2" id="mkt-usecases-title">
              Why teams choose Lugemi
            </h2>
            <p className="mkt-lede">
              Built for the conversations that move African markets — and the global corridors that connect them.
            </p>
            <div className="mkt-usecase-grid">
              {USE_CASES.map((item) => (
                <article key={item.title} className={`mkt-usecase mkt-usecase-${item.tone}`}>
                  <AnamorphicPanel variant={item.art} size="sm" label={item.title} className="mkt-usecase-media" />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section" id="hubs" aria-labelledby="mkt-ship-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Hubs</p>
            <h2 className="mkt-h2" id="mkt-ship-title">
              Three ways to ship
            </h2>
            <p className="mkt-lede">Creative studio, conversational agents, or raw API — pick the surface that matches your stack.</p>
            <div className="mkt-card-grid-3">
              {SHIP_WAYS.map((way) => (
                <article key={way.title} className="mkt-ship-card">
                  <h3>{way.title}</h3>
                  <p>{way.body}</p>
                  <ul className="mkt-ship-tags" aria-label={`${way.title} capabilities`}>
                    {way.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <Link href={way.href} className="mkt-text-link">
                    Open {way.title} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="studio" aria-labelledby="mkt-creative-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Lugemi Creative</p>
            <h2 className="mkt-h2" id="mkt-creative-title">
              Create, edit, and localize every African voice
            </h2>
            <p className="mkt-lede">
              Lugemi Studio is the authenticated console for scripts, voices, and review. Surfaces below are
              illustrative — not live sessions.
            </p>

            <div className="mkt-feature-grid">
              {CREATIVE_FEATURES.map((feature) => (
                <article key={feature.title} className="mkt-plain-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>

            <div className="mkt-module">
              <div className="mkt-module-copy">
                <h3>Lugemi Studio</h3>
                <p>
                  Draft narration, pick registry languages, and review synthetic disclosure before publish. Speech and
                  clone paths open after sign-up.
                </p>
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Open Studio
                </Link>
              </div>
              <div className="mkt-module-panel">
                <div className="mkt-fake-ui">
                  <div className="mkt-fake-ui-bar">Studio sample</div>
                  <p className="mkt-fake-ui-script">
                    Habari — your brand can speak to customers in Swahili, Yoruba, and French from one draft.
                  </p>
                  <div className="mkt-fake-chips">
                    <span>English</span>
                    <span className="is-on">Swahili</span>
                    <span>Yoruba</span>
                    <span>French</span>
                    <span>Amharic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mkt-section" id="agents" aria-labelledby="mkt-agents-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Lugemi Agents</p>
            <h2 className="mkt-h2" id="mkt-agents-title">
              Deploy agents that talk, type, and act
            </h2>
            <p className="mkt-lede">
              First-party speaking agents for developers — listen, reason, and reply aloud with cultural understanding
              of countries, ethnic groups, and tribes.
            </p>

            <div className="mkt-feature-grid">
              {AGENT_FEATURES.map((feature) => (
                <article key={feature.title} className="mkt-plain-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>

            <div className="mkt-module mkt-module-reverse">
              <div className="mkt-module-copy">
                <h3>Speaking agents</h3>
                <p>
                  Simulate turns via <code className="vl-code">POST /v1/voice/simulate</code> or open Agent Runtime in
                  the console. Africa-first completeness is the investment priority.
                </p>
                <Link href="/voice" className="vl-btn vl-btn-primary">
                  Open Agents
                </Link>
              </div>
              <div className="mkt-module-panel">
                <div className="mkt-fake-chat">
                  <div className="mkt-fake-ui-bar">Agent transcript · East Africa trade desk</div>
                  <div className="mkt-chat-bubble mkt-chat-user">Habari — naweza kupata bei za usafirishaji?</div>
                  <div className="mkt-chat-bubble mkt-chat-agent">
                    Karibu. Ninaweza kukusaidia na bei, malipo, na ratiba ya usafirishaji.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="api" aria-labelledby="mkt-api-title">
          <div className="mkt-wrap mkt-api-split">
            <div>
              <p className="mkt-kicker">Lugemi API</p>
              <h2 className="mkt-h2" id="mkt-api-title">
                Or build anything with Lugemi APIs
              </h2>
              <p className="mkt-lede">
                Install <code className="vl-code">@lugemi/sdk</code> and authenticate with{' '}
                <code className="vl-code">Authorization: Bearer lg_live_...</code>. First-party endpoints for speech,
                translate, detect, and voice simulate.
              </p>
              <div className="mkt-api-tabs" role="tablist" aria-label="API surfaces">
                {API_TABS.map((tab) => (
                  <Link key={tab.id} href={tab.href} className="mkt-api-tab" role="tab">
                    {tab.label}
                  </Link>
                ))}
              </div>
              <div className="mkt-inline-links">
                <Link href="/docs" className="vl-btn vl-btn-primary">
                  Explore docs
                </Link>
                <Link href="/playground" className="vl-btn vl-btn-secondary">
                  Playground
                </Link>
              </div>
            </div>
            <pre className="mkt-code" tabIndex={0}>
              {SDK_SAMPLE}
            </pre>
          </div>
        </section>

        <section className="mkt-section" id="impact" aria-labelledby="mkt-impact-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Impact</p>
            <h2 className="mkt-h2" id="mkt-impact-title">
              Infrastructure with a mission
            </h2>
            <div className="mkt-card-grid-3">
              {IMPACT.map((item) => (
                <article key={item.title} className="mkt-plain-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="research" aria-labelledby="mkt-research-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Research</p>
            <h2 className="mkt-h2" id="mkt-research-title">
              Research timeline
            </h2>
            <p className="mkt-lede">
              Milestones that shaped the platform. Coverage remains per language and task — see the public matrix.
            </p>
            <ol className="mkt-timeline">
              {TIMELINE.map((item) => (
                <li key={item.year}>
                  <span className="mkt-timeline-year">{item.year}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
            <div className="mkt-inline-links">
              <Link href="/coverage" className="vl-btn vl-btn-primary">
                View language coverage
              </Link>
            </div>
          </div>
        </section>

        <section className="mkt-section" id="safety" aria-labelledby="mkt-safety-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Safety</p>
            <h2 className="mkt-h2" id="mkt-safety-title">
              Safety by design
            </h2>
            <p className="mkt-lede">
              Controls that exist in product paths today. We do not display SOC 2 or similar badges without published
              evidence.
            </p>
            <div className="mkt-card-grid-4">
              {SAFETY.map((item) => (
                <article key={item.title} className="mkt-plain-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="updates" aria-labelledby="mkt-updates-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Latest on the platform</p>
            <h2 className="mkt-h2" id="mkt-updates-title">
              Product in build
            </h2>
            <div className="mkt-card-grid-3">
              {UPDATES.map((item) => (
                <article key={item.title} className="mkt-plain-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-banner" aria-labelledby="mkt-banner-title">
          <div className="mkt-wrap mkt-banner-inner">
            <h2 id="mkt-banner-title">Africa&apos;s AI communication platform</h2>
            <p>Start creating with Lugemi Voice, Speech, and Translate — or talk to us about your workspace.</p>
            <div className="mkt-cta-row">
              <Link href="/sign-up" className="vl-btn mkt-btn-banner">
                Start building
              </Link>
              <Link href="/sign-up" className="vl-btn mkt-btn-banner-ghost">
                Talk to us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mkt-footer">
        <div className="mkt-wrap">
          <div className="mkt-footer-brand-row">
            <div className="mkt-footer-top">
              <BrandMark />
            </div>
            <p className="mkt-footer-mission">
              Global language intelligence. Africa first. First-party API and models for voice, speech, translation,
              and speaking agents.
            </p>
          </div>
          <div className="mkt-footer-grid">
            <div>
              <h2>Product</h2>
              <ul>
                <li>
                  <Link href="/sign-up">Lugemi Studio</Link>
                </li>
                <li>
                  <Link href="/audio">Lugemi Voice</Link>
                </li>
                <li>
                  <Link href="/speech">Lugemi Speech</Link>
                </li>
                <li>
                  <Link href="/translate">Lugemi Translate</Link>
                </li>
                <li>
                  <Link href="/voice">Lugemi Agents</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Developers</h2>
              <ul>
                <li>
                  <Link href="/docs">API reference</Link>
                </li>
                <li>
                  <Link href="/docs">Lugemi API</Link>
                </li>
                <li>
                  <Link href="/playground">Playground</Link>
                </li>
                <li>
                  <Link href="/developers">Developer hub</Link>
                </li>
                <li>
                  <Link href="/models">Models</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Solutions</h2>
              <ul>
                <li>
                  <Link href="#use-cases">Trade</Link>
                </li>
                <li>
                  <Link href="#use-cases">Education</Link>
                </li>
                <li>
                  <Link href="#use-cases">Customer experience</Link>
                </li>
                <li>
                  <Link href="#hubs">Creative</Link>
                </li>
                <li>
                  <Link href="#agents">Agents</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Resources</h2>
              <ul>
                <li>
                  <Link href="/docs">Docs</Link>
                </li>
                <li>
                  <Link href="/coverage">Coverage</Link>
                </li>
                <li>
                  <Link href="#research">Research</Link>
                </li>
                <li>
                  <Link href="#safety">Safety</Link>
                </li>
                <li>
                  <Link href="#updates">Latest updates</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Socials</h2>
              <ul>
                <li>
                  <a href="https://lugemi.com" rel="noreferrer">
                    lugemi.com
                  </a>
                </li>
                <li>
                  <span className="mkt-footer-muted">X — channel opens after brand launch</span>
                </li>
                <li>
                  <span className="mkt-footer-muted">LinkedIn — channel opens after brand launch</span>
                </li>
              </ul>
            </div>
            <div>
              <h2>Company</h2>
              <ul>
                <li>
                  <Link href="#impact">About</Link>
                </li>
                <li>
                  <Link href="/sign-in">Log in</Link>
                </li>
                <li>
                  <Link href="/sign-up">Sign up</Link>
                </li>
                <li>
                  <Link href="#safety">Safety</Link>
                </li>
                <li>
                  <Link href="/dashboard">Open console</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mkt-footer-meta">
            <span>© Lugemi. All rights reserved.</span>
            <a href="https://lugemi.com">lugemi.com</a>
            <span> · Africa-first language intelligence · every country, every community</span>
          </div>
        </div>
      </footer>

      <a className="mkt-support-fab" href="/sign-up" aria-label="Chat support — open sign up">
        <span className="mkt-support-fab-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2.5 3.5h11a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1H8l-3.2 2.4V11H2.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="mkt-support-fab-label">Support</span>
      </a>
    </div>
  );
}

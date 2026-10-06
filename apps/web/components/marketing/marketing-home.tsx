import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { HeroTtsCard } from './hero-tts-card';
import { LanguageBar } from './language-bar';
import { MarketingNav } from './nav';
import './marketing.css';

const SDK_SAMPLE = `import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
});

const speech = await client.speech({
  text: 'Habari, dunia.',
  voice: 'own:sw-ke-female',
});

const translated = await client.translate({
  text: 'Habari, dunia.',
  source: 'sw',
  target: 'en',
});`;

const PRODUCTS = [
  {
    name: 'Lugemi Voice',
    body: 'Text to speech and cloning. Resonant, real-time African voices for content, brand, and personal presence.',
    href: '/speech',
    art: 'voice',
  },
  {
    name: 'Lugemi Speech',
    body: 'Speech to text. Transcribe accents, dialects, and code-switching with research intelligence built for Africa.',
    href: '/audio',
    art: 'speech',
  },
  {
    name: 'Lugemi Translate',
    body: 'Translate every tongue. Move meaning across African languages with global context — without context loss.',
    href: '/translate',
    art: 'translate',
  },
] as const;

const USE_CASES = [
  { title: 'Trade & negotiations', body: 'Close deals in the languages partners actually speak — with tone that holds trust.', tone: 'gold' },
  { title: 'Education', body: 'Teach and tutor across mother tongues so literacy and STEM travel further.', tone: 'blue' },
  { title: 'Sales & marketing', body: 'Localize campaigns and product voice without flattening cultural nuance.', tone: 'rose' },
  { title: 'Public speech', body: 'Civic address, broadcast, and advocacy that sound native, not dubbed.', tone: 'teal' },
  { title: 'Customer experience', body: 'Support and IVR that understand accents, switches, and regional phrasing.', tone: 'green' },
  { title: 'Creative voice', body: 'Agencies and creators ship narration, ads, and character voices at production pace.', tone: 'violet' },
] as const;

const SHIP_WAYS = [
  { title: 'Creative', items: ['Text to speech', 'Speech to text', 'Voice clone (consent-gated)', 'Studio review'] },
  { title: 'Agents', items: ['Voice FAQ agents', 'Conversational turns', 'STT → model → TTS', 'Twilio inbound hooks'] },
  { title: 'API', items: ['@verbalab/sdk', 'Bearer vl_live_ keys', 'Speech, translate, detect', 'Usage metering'] },
] as const;

const IMPACT = [
  { title: 'Language sovereignty', body: 'First-party models and a public coverage matrix — African languages are the investment priority, not an afterthought locale pack.' },
  { title: 'Freedom of priority', body: 'Ship for Africa first, then expand into LATAM, Southeast Asia, the Middle East, and the EU with the same API surface.' },
  { title: 'Digital infrastructure', body: 'Registry, metering, workspaces, and review controls so speech and translation can run as production infrastructure.' },
] as const;

const TIMELINE = [
  { year: '2023', title: 'African Language Registry', body: 'Seed languages, scripts, and task metadata for honest coverage claims.' },
  { year: '2024', title: 'Cultural intelligence graph', body: 'Dialect and accent metadata wired into speech and translation review paths.' },
  { year: '2025', title: 'First-party voice path', body: 'own:* voices and API keys as the intended production route — not a wrapper stack.' },
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
  { title: 'Lugemi identity', body: 'Brand, domain lugemi.com, and symbol mark applied across the marketing surface.' },
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
              <p className="mkt-eyebrow">Voice · Speech · Translate · API</p>
              <h1 id="mkt-hero-title">
                <span className="mkt-brand-hero">Lugemi</span>
                <span className="mkt-tagline">Own every African voice.</span>
              </h1>
              <p className="mkt-hero-lead">
                Speak, translate, clone, and reason across 40+ languages, accents, and cultures — for trade,
                education, sales, public speech, and problem-solving. First-party API and models; Africa first,
                with LATAM, Southeast Asia, the Middle East, and the EU in scope.
              </p>
              <div className="mkt-cta-row">
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Start free
                </Link>
                <Link href="/dashboard" className="vl-btn vl-btn-secondary">
                  Open console
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
              One platform for African voice, speech, and translation
            </h2>
            <p className="mkt-lede">
              Three product surfaces on the same first-party foundation. Availability follows the published coverage
              matrix — not a claim that every dialect is live everywhere.
            </p>
            <div className="mkt-card-grid-3">
              {PRODUCTS.map((product) => (
                <article key={product.name} className="mkt-product-card">
                  <div className={`mkt-product-art mkt-product-art-${product.art}`} aria-hidden="true" />
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
                  <ul>
                    {way.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="studio" aria-labelledby="mkt-modules-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Deep modules</p>
            <h2 className="mkt-h2" id="mkt-modules-title">
              Studio, Agents, and API
            </h2>
            <p className="mkt-lede">
              Illustrative product surfaces — not live sessions. Sign up to open the console; docs cover the SDK.
            </p>

            <div className="mkt-module">
              <div className="mkt-module-copy">
                <h3>Lugemi Studio</h3>
                <p>
                  Create and localize scripts, pick languages, and review output before it ships. Studio is the
                  authenticated console path after sign-up.
                </p>
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Open Studio
                </Link>
              </div>
              <div className="mkt-module-panel" aria-hidden="true">
                <div className="mkt-fake-ui">
                  <div className="mkt-fake-ui-bar">Studio editor</div>
                  <p className="mkt-fake-ui-script">
                    Hello! Your brand can speak to customers in Swahili, Yoruba, and French from one draft.
                  </p>
                  <div className="mkt-fake-chips">
                    <span>English</span>
                    <span className="is-on">Swahili</span>
                    <span>French</span>
                    <span>Yoruba</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mkt-module mkt-module-reverse">
              <div className="mkt-module-copy">
                <h3>Lugemi Agents</h3>
                <p>
                  Conversational voice FAQ turns: STT, a FAQ model, and TTS. Simulate from the console or call{' '}
                  <code className="vl-code">POST /v1/voice/simulate</code>.
                </p>
                <Link href="/voice" className="vl-btn vl-btn-primary">
                  Open Agents
                </Link>
              </div>
              <div className="mkt-module-panel" aria-hidden="true">
                <div className="mkt-fake-chat">
                  <div className="mkt-fake-ui-bar">Agent: Mandisa</div>
                  <div className="mkt-chat-bubble mkt-chat-user">I would like to place an order for chips, please.</div>
                  <div className="mkt-chat-bubble mkt-chat-agent">
                    Of course — I can take that order. How many portions would you like?
                  </div>
                </div>
              </div>
            </div>

            <div className="mkt-module">
              <div className="mkt-module-copy">
                <h3>Lugemi API</h3>
                <p>
                  Install <code className="vl-code">@verbalab/sdk</code> and authenticate with{' '}
                  <code className="vl-code">Authorization: Bearer vl_live_...</code>. Historical package name is
                  intentional.
                </p>
                <div className="mkt-inline-links">
                  <Link href="/docs" className="vl-btn vl-btn-primary">
                    API docs
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
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
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
            <p className="mkt-kicker">Latest updates</p>
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
                Start creating
              </Link>
              <Link href="/sign-up" className="vl-btn mkt-btn-banner-ghost">
                Talk to sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mkt-footer">
        <div className="mkt-wrap">
          <div className="mkt-footer-top">
            <BrandMark />
          </div>
          <div className="mkt-footer-grid">
            <div>
              <h2>Creation</h2>
              <ul>
                <li>
                  <Link href="/speech">Lugemi Studio</Link>
                </li>
                <li>
                  <Link href="/speech">Lugemi Voice</Link>
                </li>
                <li>
                  <Link href="/audio">Lugemi Speech</Link>
                </li>
                <li>
                  <Link href="/translate">Lugemi Translate</Link>
                </li>
                <li>
                  <Link href="/localize">Localize</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Agents</h2>
              <ul>
                <li>
                  <Link href="/voice">Voice agents</Link>
                </li>
                <li>
                  <Link href="/voice">Conversational FAQ</Link>
                </li>
                <li>
                  <Link href="/chat">Chat</Link>
                </li>
                <li>
                  <Link href="#hubs">Agent hub</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Capability</h2>
              <ul>
                <li>
                  <Link href="/docs">API reference</Link>
                </li>
                <li>
                  <Link href="/models">Models</Link>
                </li>
                <li>
                  <Link href="/coverage">Coverage</Link>
                </li>
                <li>
                  <Link href="/playground">Playground</Link>
                </li>
                <li>
                  <Link href="/developers">Developer hub</Link>
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
                  <span className="mkt-footer-muted">X — coming soon</span>
                </li>
                <li>
                  <span className="mkt-footer-muted">LinkedIn — coming soon</span>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

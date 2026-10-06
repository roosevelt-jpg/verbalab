import Link from 'next/link';
import { LanguagePlayers } from './language-players';
import { LanguageTicker } from './language-ticker';
import { MarketingNav } from './nav';
import { TtsHeroCard } from './tts-hero-card';

const SDK_SAMPLE = `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
});

const speech = await client.speech({
  text: 'Habari, dunia.',
  voice: 'alloy',
});

const translated = await client.translate({
  text: 'Habari, dunia.',
  source: 'sw',
  target: 'en',
});`;

export function MarketingHome() {
  return (
    <div className="mkt">
      <a className="mkt-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav />
      <main id="main">
        <section className="mkt-hero">
          <div className="mkt-wrap mkt-hero-grid">
            <div className="mkt-hero-copy">
              <p className="mkt-brand-hero">Lugemi</p>
              <h1 className="mkt-tagline">Own every African voice.</h1>
              <p className="mkt-hero-lead">
                Fully built Africa-first language intelligence — speech, translation, and language tools for every
                language and dialect across African countries and ethnic communities. First-party API and models, with
                LATAM, Southeast Asia, the Middle East, and the EU also in product scope.
              </p>
              <div className="mkt-cta-row">
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Start free
                </Link>
                <Link href="/sign-in" className="vl-btn vl-btn-secondary">
                  Open console
                </Link>
              </div>
            </div>
            <TtsHeroCard />
          </div>
        </section>

        <LanguageTicker />
        <LanguagePlayers />

        <section className="mkt-section mkt-section-mist" id="products" aria-labelledby="mkt-platforms-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Platform</p>
            <h2 className="mkt-h2" id="mkt-platforms-title">
              One platform for African voice, speech, and language
            </h2>
            <p className="mkt-lede">
              Work in Lugemi Studio when you need a friendly console, or call the Lugemi API when you are shipping
              product. Both sit on the same first-party models — not a wrapper around another vendor.
            </p>
            <div className="mkt-card-grid-3">
              <article className="mkt-card">
                <h3>Speech and sensing</h3>
                <p>Text-to-speech, transcription, and voice tools tuned for African languages, accents, and scripts.</p>
                <Link href="/speech" className="vl-btn vl-btn-primary">
                  Open Speech
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Translate every tongue</h3>
                <p>Translate and localize across the Africa language directory, with glossaries and review in Studio.</p>
                <Link href="/translate" className="vl-btn vl-btn-primary">
                  Open Translate
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Developer APIs</h3>
                <p>
                  Copy-paste SDKs and REST endpoints. Install <code className="vl-code">@lugemi/sdk</code> and call the first-party API.
                </p>
                <Link href="/docs" className="vl-btn vl-btn-primary">
                  Read the docs
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="mkt-section" id="create" aria-labelledby="mkt-create-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Studio tools</p>
            <h2 className="mkt-h2" id="mkt-create-title">
              Create, edit, and localize
            </h2>
            <p className="mkt-lede">
              Clear console entry points. Start with translate or speech, then add keys when you are ready to ship.
            </p>
            <div className="mkt-card-grid-3">
              <article className="mkt-card">
                <h3>Translate</h3>
                <p>Text translation with language checks, glossaries, and review.</p>
                <Link href="/translate" className="vl-btn vl-btn-primary">
                  Open Translate
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Speech</h3>
                <p>Generate speech through the Lugemi API — African-priority voices on the production path.</p>
                <Link href="/speech" className="vl-btn vl-btn-primary">
                  Open Speech
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Voice studio</h3>
                <p>Presets, consent-gated clones, and review controls in one place.</p>
                <Link href="/audio" className="vl-btn vl-btn-primary">
                  Open Voice studio
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Transcribe</h3>
                <p>Speech-to-text for recordings and workflows, with usage metering.</p>
                <Link href="/audio" className="vl-btn vl-btn-primary">
                  Open audio tools
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Localize</h3>
                <p>Catalog and i18n tree localization (JSON/YAML) with ICU passthrough.</p>
                <Link href="/localize" className="vl-btn vl-btn-primary">
                  Open Localize
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Coverage</h3>
                <p>Searchable Africa language directory — countries, languages, and ethnic varieties.</p>
                <Link href="/coverage" className="vl-btn vl-btn-primary">
                  Browse coverage
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="agents" aria-labelledby="mkt-agents-title">
          <div className="mkt-wrap mkt-split">
            <div>
              <p className="mkt-kicker">Agents</p>
              <h2 className="mkt-h2" id="mkt-agents-title">
                Agents that talk
              </h2>
              <p className="mkt-lede">
                Voice FAQ is the shipped conversational surface: inbound or simulated turns in English and Kiswahili,
                with speech-to-text, a FAQ model, and text-to-speech.
              </p>
              <div className="mkt-inline-links">
                <Link href="/voice" className="vl-btn vl-btn-primary">
                  Open Voice FAQ
                </Link>
                <Link href="/docs" className="vl-btn vl-btn-secondary">
                  API notes
                </Link>
              </div>
            </div>
            <article className="mkt-card">
              <h3>What you can do today</h3>
              <p>
                Simulate a FAQ turn from the console or call <code className="vl-code">POST /v1/voice/simulate</code>.
                Twilio webhooks exist for inbound calls.
              </p>
            </article>
          </div>
        </section>

        <section className="mkt-section" id="api" aria-labelledby="mkt-api-title">
          <div className="mkt-wrap mkt-split">
            <div>
              <p className="mkt-kicker">Developers</p>
              <h2 className="mkt-h2" id="mkt-api-title">
                Or build anything with Lugemi APIs
              </h2>
              <p className="mkt-lede">
                Install the SDK, paste a key, and call speech or translate. Plain-language docs and a playground — less
                jargon on the first screen.
              </p>
              <div className="mkt-inline-links">
                <Link href="/docs" className="vl-btn vl-btn-primary">
                  API docs
                </Link>
                <Link href="/playground" className="vl-btn vl-btn-secondary">
                  Playground
                </Link>
                <Link href="/developers" className="vl-btn vl-btn-secondary">
                  Developer hub
                </Link>
              </div>
            </div>
            <pre className="mkt-code" tabIndex={0}>
              {SDK_SAMPLE}
            </pre>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="research" aria-labelledby="mkt-research-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Coverage</p>
            <h2 className="mkt-h2" id="mkt-research-title">
              Africa first — every country, every community
            </h2>
            <p className="mkt-lede">
              Lugemi&apos;s product scope spans languages and ethnic varieties across all African countries. Latin
              America, Southeast Asia, the Middle East, and the EU stay in scope for the same first-party stack.
            </p>
            <div className="mkt-card-grid-4">
              <article className="mkt-card">
                <h3>Africa</h3>
                <p>
                  Full directory of countries and ethnic language varieties — searchable on the coverage page. API seed
                  marks which codes are live in the gateway today.
                </p>
              </article>
              <article className="mkt-card">
                <h3>Latin America</h3>
                <p>Spanish and Portuguese in the seed set, with locale-specific work continuing.</p>
              </article>
              <article className="mkt-card">
                <h3>Southeast Asia</h3>
                <p>Indonesian and Hindi in the seed registry. Script shaping and review remain active work.</p>
              </article>
              <article className="mkt-card">
                <h3>Middle East and EU</h3>
                <p>Arabic (RTL) plus French, German, Dutch, Italian, and others on the same API.</p>
              </article>
            </div>
            <div className="mkt-inline-links">
              <Link href="/coverage" className="vl-btn vl-btn-primary">
                Browse Africa coverage
              </Link>
            </div>
          </div>
        </section>

        <section className="mkt-section" id="safety" aria-labelledby="mkt-safety-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Safety</p>
            <h2 className="mkt-h2" id="mkt-safety-title">
              Safety built in
            </h2>
            <p className="mkt-lede">
              Controls that exist in the product today. We do not display SOC 2 or similar badges without published
              evidence.
            </p>
            <div className="mkt-card-grid-3">
              <article className="mkt-card">
                <h3>Consent</h3>
                <p>Voice cloning is consent-gated. Marketing does not imply speaker authorization for every use.</p>
              </article>
              <article className="mkt-card">
                <h3>Review</h3>
                <p>Clone profiles can be reviewed, approved, rejected, or disabled. Translation review feeds memory.</p>
              </article>
              <article className="mkt-card">
                <h3>Disclosure</h3>
                <p>Generated speech should be identifiable where it could be mistaken for a person.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="enterprise" aria-labelledby="mkt-enterprise-title">
          <div className="mkt-wrap mkt-split">
            <div>
              <p className="mkt-kicker">Get started</p>
              <h2 className="mkt-h2" id="mkt-enterprise-title">
                Africa&apos;s language intelligence platform
              </h2>
              <p className="mkt-lede">
                Create a workspace, open the console, and start with translate or speech. Add an API key when you are
                ready to ship.
              </p>
              <div className="mkt-inline-links">
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Start free
                </Link>
                <Link href="/sign-in" className="vl-btn vl-btn-secondary">
                  Open console
                </Link>
              </div>
            </div>
            <article className="mkt-card">
              <h3>In the console</h3>
              <p>
                Keys, billing usage, organization members, and data settings live behind authentication. Public docs
                describe the API in plain language.
              </p>
            </article>
          </div>
        </section>

        <section className="mkt-section" id="updates" aria-labelledby="mkt-updates-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Latest updates</p>
            <h2 className="mkt-h2" id="mkt-updates-title">
              On the platform
            </h2>
            <div className="mkt-note">
              <h3>What recently landed</h3>
              <p className="mkt-lede" style={{ marginTop: 0 }}>
                Notes from product work in this repository — not invented press.
              </p>
              <ul>
                <li>Africa language directory across all countries and ethnic communities on /coverage.</li>
                <li>Long-form Lugemi homepage with TTS card, Start free / Open console, and language ticker.</li>
                <li>Friendlier docs, playground, and dashboard what-to-do-next guidance.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="mkt-footer" id="contact">
        <div className="mkt-wrap">
          <div className="mkt-footer-grid">
            <div>
              <div className="mkt-footer-brand">Lugemi</div>
              <p style={{ color: '#b6c3d5', lineHeight: 1.65, maxWidth: '22rem' }}>
                Fully built Africa-first language intelligence for global markets. lugemi.com
              </p>
            </div>
            <div>
              <h2>Products</h2>
              <ul>
                <li>
                  <Link href="#products">Studio</Link>
                </li>
                <li>
                  <Link href="/translate">Translate</Link>
                </li>
                <li>
                  <Link href="/speech">Speech</Link>
                </li>
                <li>
                  <Link href="/localize">Localize</Link>
                </li>
                <li>
                  <Link href="/voice">Voice FAQ</Link>
                </li>
                <li>
                  <Link href="/audio">Voice studio</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Developers</h2>
              <ul>
                <li>
                  <Link href="/docs">Docs</Link>
                </li>
                <li>
                  <Link href="/playground">Playground</Link>
                </li>
                <li>
                  <Link href="/developers">Developer hub</Link>
                </li>
                <li>
                  <Link href="/coverage">Coverage</Link>
                </li>
                <li>
                  <Link href="#api">SDK sample</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2>Company</h2>
              <ul>
                <li>
                  <Link href="#research">Coverage</Link>
                </li>
                <li>
                  <Link href="#safety">Safety</Link>
                </li>
                <li>
                  <Link href="#enterprise">Get started</Link>
                </li>
                <li>
                  <Link href="/sign-in">Log in</Link>
                </li>
                <li>
                  <Link href="/sign-up">Sign up</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mkt-footer-meta">
            <a href="https://lugemi.com">lugemi.com</a>
            <span> · Africa-first language intelligence · every country, every community</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

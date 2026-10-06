import Link from 'next/link';
import { LanguagePlayers } from './language-players';
import { MarketingNav } from './nav';

const SDK_SAMPLE = `import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
});

const translated = await client.translate({
  text: 'Habari, dunia.',
  source: 'sw',
  target: 'en',
});

const speech = await client.speech({
  text: 'Habari, dunia.',
  voice: 'alloy',
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
          <div className="mkt-wrap">
            <h1>Global language intelligence. Africa first.</h1>
            <p className="mkt-hero-lead">
              Create, understand and communicate through speech, translation and language tools built around local
              context, with African languages at the centre of our investment. Lugemi is first-party infrastructure:
              our API and our models — not a wrapper around another speech vendor.
            </p>
            <div className="mkt-cta-row">
              <Link href="/sign-up" className="vl-btn vl-btn-primary">
                Explore Lugemi
              </Link>
              <Link href="/coverage" className="vl-btn vl-btn-secondary">
                View language coverage
              </Link>
            </div>
          </div>
        </section>

        <LanguagePlayers />

        <section className="mkt-section mkt-section-mist" id="products" aria-labelledby="mkt-platforms-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Platforms</p>
            <h2 className="mkt-h2" id="mkt-platforms-title">
              Two platforms. One language foundation.
            </h2>
            <p className="mkt-lede">
              Work in Lugemi Studio when you need a console, or call the Lugemi API when you are shipping product.
              Both sit on the same first-party models and language registry.
            </p>
            <div className="mkt-card-grid-2">
              <article className="mkt-card">
                <div className="mkt-tile-art" aria-hidden="true" />
                <p className="mkt-caption">Illustrative Studio layout — not a live session.</p>
                <h3>Lugemi Studio</h3>
                <p>
                  The workspace for speech, translation, localization, and review. Sign up to open the console
                  (dashboard after authentication).
                </p>
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Open Studio
                </Link>
              </article>
              <article className="mkt-card">
                <div className="mkt-tile-art-mist" aria-hidden="true" />
                <p className="mkt-caption">API keys use Bearer vl_live_ / vl_test_ headers.</p>
                <h3>Lugemi API</h3>
                <p>
                  Generate speech, transcribe, and translate with documented endpoints and{' '}
                  <code className="vl-code">@verbalab/sdk</code>. Start from the public docs.
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
            <p className="mkt-kicker">Workflows</p>
            <h2 className="mkt-h2" id="mkt-create-title">
              Create, edit and localize
            </h2>
            <p className="mkt-lede">
              Task surfaces that already exist in the product. Availability still follows the published coverage
              matrix — not a claim that every language is live for every task.
            </p>
            <div className="mkt-card-grid-3">
              <article className="mkt-card">
                <h3>Translate</h3>
                <p>Text translation with registry language checks, glossaries, and review in the console.</p>
                <Link href="/translate" className="vl-btn vl-btn-primary">
                  Open Translate
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Speech</h3>
                <p>Text-to-speech through the Lugemi API. African-priority voices are the intended production path.</p>
                <Link href="/speech" className="vl-btn vl-btn-primary">
                  Open Speech
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Transcribe</h3>
                <p>Speech-to-text for recordings and workflows, with usage metering and language metadata.</p>
                <Link href="/audio" className="vl-btn vl-btn-primary">
                  Open audio tools
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Localize</h3>
                <p>Catalog and i18n tree localization (JSON/YAML) with ICU passthrough on the localize route.</p>
                <Link href="/localize" className="vl-btn vl-btn-primary">
                  Open Localize
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Voice studio</h3>
                <p>Generate speech, language presets, and consent-gated clones with review controls.</p>
                <Link href="/audio" className="vl-btn vl-btn-primary">
                  Open Voice studio
                </Link>
              </article>
              <article className="mkt-card">
                <h3>Coverage</h3>
                <p>Published language and task availability. Use this before promising a dialect in production.</p>
                <Link href="/coverage" className="vl-btn vl-btn-primary">
                  View coverage
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
                with STT, a FAQ model, and TTS. It is not a general autonomous agent platform.
              </p>
              <div className="mkt-inline-links">
                <Link href="/voice" className="vl-btn vl-btn-primary">
                  Open Voice FAQ
                </Link>
                <Link href="/docs" className="vl-btn vl-btn-secondary">
                  Voice API notes
                </Link>
              </div>
            </div>
            <article className="mkt-card">
              <h3>What you can do today</h3>
              <p>
                Simulate a FAQ turn from the console or call <code className="vl-code">POST /v1/voice/simulate</code>.
                Twilio webhooks exist for inbound calls. Prompts are versioned separately from this page.
              </p>
            </article>
          </div>
        </section>

        <section className="mkt-section" id="api" aria-labelledby="mkt-api-title">
          <div className="mkt-wrap mkt-split">
            <div>
              <p className="mkt-kicker">Developers</p>
              <h2 className="mkt-h2" id="mkt-api-title">
                Build with the API
              </h2>
              <p className="mkt-lede">
                Install <code className="vl-code">@verbalab/sdk</code> and talk to first-party endpoints. The
                historical package name is intentional — do not rename it in application code. Authenticate with{' '}
                <code className="vl-code">Authorization: Bearer vl_live_...</code>.
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
            <p className="mkt-kicker">Research</p>
            <h2 className="mkt-h2" id="mkt-research-title">
              Africa first, then the regions we are building for
            </h2>
            <p className="mkt-lede">
              Africa is the product investment priority. Latin America, Southeast Asia, the Middle East, and the EU
              are in strategic scope. We do not claim all languages, and coverage is published per language and task.
            </p>
            <div className="mkt-card-grid-4">
              <article className="mkt-card">
                <h3>Africa</h3>
                <p>
                  Strategic African seeds include Kiswahili, Yorùbá, Hausa, Amharic, isiZulu, Igbo, Somali, and more
                  in the core registry.
                </p>
              </article>
              <article className="mkt-card">
                <h3>Latin America</h3>
                <p>Spanish and Portuguese are in the vendor-tier seed set, with locale-specific work still ahead.</p>
              </article>
              <article className="mkt-card">
                <h3>Southeast Asia</h3>
                <p>Indonesian and Hindi appear in the seed registry. Script shaping and review are required work.</p>
              </article>
              <article className="mkt-card">
                <h3>Middle East and EU</h3>
                <p>
                  Arabic (RTL) plus French, German, Dutch, Italian, and others in the vendor set — not a complete EU
                  catalog.
                </p>
              </article>
            </div>
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
              Safety built in
            </h2>
            <p className="mkt-lede">
              Controls that exist in the product today. We do not display SOC 2 or similar badges; those claims need
              evidence we have not published here.
            </p>
            <div className="mkt-card-grid-3">
              <article className="mkt-card">
                <h3>Consent</h3>
                <p>
                  Voice cloning is consent-gated. Marketing does not imply that speaker authorization has been
                  collected for every use.
                </p>
              </article>
              <article className="mkt-card">
                <h3>Review</h3>
                <p>
                  Clone profiles can be reviewed, approved, rejected, or disabled. Translation review can accept work
                  into translation memory.
                </p>
              </article>
              <article className="mkt-card">
                <h3>Synthetic-speech disclosure</h3>
                <p>
                  Generated speech should be identifiable where it could be mistaken for a person. Watermarking applies
                  to clone voices on the speech endpoint.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="enterprise" aria-labelledby="mkt-enterprise-title">
          <div className="mkt-wrap mkt-split">
            <div>
              <p className="mkt-kicker">Organizations</p>
              <h2 className="mkt-h2" id="mkt-enterprise-title">
                Workspace controls, not a separate enterprise myth
              </h2>
              <p className="mkt-lede">
                Organizations get members, API keys, usage, and data-settings in the console after sign-in. There is
                no standalone sales portal yet — use sign-up, then the authenticated workspace.
              </p>
              <div className="mkt-inline-links">
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Create a workspace
                </Link>
                <Link href="/sign-in" className="vl-btn vl-btn-secondary">
                  Sign in
                </Link>
              </div>
            </div>
            <article className="mkt-card">
              <h3>In the console</h3>
              <p>
                Keys, billing usage, organization members, and data retention flags live behind authentication. Public
                docs describe the API; they are not a substitute for an enterprise contract.
              </p>
            </article>
          </div>
        </section>

        <section className="mkt-section" id="updates" aria-labelledby="mkt-updates-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">Latest updates</p>
            <h2 className="mkt-h2" id="mkt-updates-title">
              Product in build
            </h2>
            <div className="mkt-note">
              <h3>What recently landed in this repository</h3>
              <p className="mkt-lede" style={{ marginTop: 0 }}>
                There is no public blog yet. These notes come from recent product work, not invented articles.
              </p>
              <ul>
                <li>Public language coverage page for the homepage coverage CTA.</li>
                <li>Positioning as first-party language intelligence (API and models), not a vendor wrapper.</li>
                <li>Lugemi identity and lugemi.com as the public domain on the web app.</li>
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
                Language intelligence, built around you. No invented phone number or street address on this page.
                Sales conversations start from a workspace account until a dedicated channel exists.
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
                  <Link href="#research">Research</Link>
                </li>
                <li>
                  <Link href="#safety">Safety</Link>
                </li>
                <li>
                  <Link href="#enterprise">Enterprise</Link>
                </li>
                <li>
                  <Link href="/sign-in">Sign in</Link>
                </li>
                <li>
                  <Link href="/sign-up">Sign up</Link>
                </li>
                <li>
                  <Link href="#updates">News</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mkt-footer-meta">
            <a href="https://lugemi.com">lugemi.com</a>
            <span> · Africa-first language intelligence for global markets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

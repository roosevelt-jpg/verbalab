import Link from 'next/link';
import { Syne } from 'next/font/google';
import { MarketingFooter } from './marketing-footer';
import { MarketingNav } from './nav';
import type { CmsDocument } from '@/data/cms-types';
import { FEATURE_LABELS, WEB_BILLING_PLANS } from '@/data/billing-plans';
import './enterprise.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-syne',
  display: 'swap',
});

const enterprisePlan = WEB_BILLING_PLANS.find((p) => p.id === 'enterprise')!;

const ENTITLEMENTS: { key: string; body: string }[] = [
  {
    key: 'sso',
    body: 'Single sign-on for enterprise workspaces via your identity provider (Clerk SSO / OIDC). SAML and SCIM are available through the IdP path when contracted.',
  },
  {
    key: 'dedicated',
    body: 'Dedicated capacity packaging for mission-critical speech, translate, and agent workloads — scoped with sales for concurrency and regional routing.',
  },
  {
    key: 'workspacesExtra',
    body: 'Unlimited workspaces under one organization so regional teams share the same entitlements without seat gymnastics.',
  },
  {
    key: 'prioritySupport',
    body: 'Priority support paths for production incidents, plus custom SLA packaging on Enterprise contracts.',
  },
  {
    key: 'voiceClones',
    body: 'Consent-gated Instant Voice Clones and approved clone:{id} refs for brand voices across Studio, Agents, and API.',
  },
  {
    key: 'commercial',
    body: 'Commercial use of Lugemi speech, translate, and first-party models (Baobab, Atlas, Echo, and the broader Lugemi family).',
  },
];

const INTEGRATIONS = [
  {
    name: 'Twilio',
    body: 'Route inbound and outbound calls through Lugemi STT → translate → TTS on your Twilio numbers.',
  },
  {
    name: 'HubSpot',
    body: 'Localize tickets and call notes with dialect-aware language intelligence before CRM writeback.',
  },
  {
    name: 'Salesforce',
    body: 'Translate case comments, transcribe recordings, and keep dialect fields on contacts.',
  },
  {
    name: 'Stripe',
    body: 'Voice commerce and payment confirmations in customer dialects — Lugemi does not vault cards.',
  },
  {
    name: 'Slack',
    body: 'Slash-command and channel localization for African trade and multilingual support desks.',
  },
  {
    name: 'Contact centers',
    body: 'Ingest call audio, coach agents, and speak back in the caller language across CCaaS stacks.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Do you support HIPAA or clinical workloads?',
    a: 'We do not claim HIPAA eligibility as a published certification today. Healthcare and government teams can use retention controls, vendor-training flags, audit logs, and Language Integrity review paths. If you need a BAA or a formal compliance pathway, talk to sales so legal can scope what is in contract versus what is already in product.',
  },
  {
    q: 'Where is my data stored? Do you support regional data residency?',
    a: 'Yes. Lugemi runs residency islands — Africa-first (Johannesburg), plus US and EU deploys. Organizations can pin a data region; a pin does not migrate existing data, and API calls must hit the matching island.',
  },
  {
    q: 'Can you support large-scale deployments and traffic spikes?',
    a: 'Enterprise includes dedicated capacity packaging and higher rate limits. Custom service-level agreements are available for mission-critical speech and agent workloads — scoped per contract, not as a self-serve toggle.',
  },
  {
    q: 'Do you offer engineering support for custom deployments?',
    a: 'Yes. Enterprise customers get deployment assistance to integrate LugemiCreative, LugemiAgents, and the first-party API into private environments, contact centers, and existing CRM or telephony stacks.',
  },
  {
    q: 'Do you support SSO and RBAC?',
    a: 'Yes. SSO is an Enterprise plan entitlement and wires through Clerk identity (OIDC / IdP SSO). Workspace RBAC covers owner, admin, and member roles. Audit events are available in the console under Audit.',
  },
  {
    q: 'What security and compliance claims are real today?',
    a: 'In product today: API keys, workspace RBAC, audit logs, retention and residency controls, consent-gated cloning, Language Integrity attestation paths, and synthetic-speech disclosure. We do not display SOC 2 or similar badges without published evidence — ask sales about our compliance pathway if your procurement needs it.',
  },
];

export function EnterpriseMarketingPage({ content }: { content: CmsDocument }) {
  return (
    <div className={`ent ${syne.variable}`}>
      <a className="ent-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav nav={content.nav} />
      <main id="main">
        <section className="ent-hero" aria-labelledby="ent-hero-title">
          <div className="ent-hero-visual" aria-hidden="true">
            <div className="ent-hero-orb" />
          </div>
          <div className="ent-wrap ent-hero-copy">
            <h1 id="ent-hero-title">
              <span className="ent-brand">Lugemi</span>
              <span className="ent-headline">
                The complete AI language platform for your enterprise
              </span>
            </h1>
            <p className="ent-lead">
              LugemiCreative and LugemiAgents on first-party models — Baobab, Atlas, Echo, and more —
              for customer experience, content production, and Africa-first language integrity at
              organizational scale.
            </p>
            <div className="ent-cta-row">
              <Link href="/p/about" className="vl-btn vl-btn-primary">
                Contact sales
              </Link>
              <Link href="/billing" className="vl-btn ent-btn-ghost">
                Upgrade Enterprise
              </Link>
            </div>
          </div>
        </section>

        <section className="ent-section" aria-labelledby="ent-platforms-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Platforms</p>
            <h2 className="ent-h2" id="ent-platforms-title">
              Agents and creative on one foundation
            </h2>
            <p className="ent-lede">
              Build conversational speaking agents and generate expressive speech from the same
              Lugemi API, registry, and model portfolio.
            </p>
            <div className="ent-platforms">
              <article className="ent-platform">
                <h3>LugemiAgents</h3>
                <p>
                  Build, deploy, and monitor conversational agents that listen, reason, and reply
                  aloud with cultural context — grounded in your data and ready for contact-center
                  and chat rollouts.
                </p>
                <Link href="/p/lugemi-agents">Explore Agents →</Link>
              </article>
              <article className="ent-platform">
                <h3>LugemiCreative</h3>
                <p>
                  Generate ultra-realistic speech, dubbing, and studio narration with region-aware
                  own:* voices and consent-gated clones — emotional depth for ads, learning, and
                  public speech.
                </p>
                <Link href="/p/lugemi-studio">Explore Creative →</Link>
              </article>
            </div>
          </div>
        </section>

        <section className="ent-section ent-section-mist" aria-labelledby="ent-trust-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Industries</p>
            <h2 className="ent-h2" id="ent-trust-title">
              Built for multilingual operations
            </h2>
            <p className="ent-lede">
              Teams use Lugemi to power products and operations — from multilingual customer support
              and 24/7 scheduling to education, trade, government, and creative voice.
            </p>
            <ul className="ent-trust-row" aria-label="Industry focus">
              <li>Customer support</li>
              <li>Telecommunications</li>
              <li>Financial services</li>
              <li>Healthcare</li>
              <li>Government</li>
              <li>Education</li>
              <li>Retail &amp; travel</li>
              <li>Creative media</li>
            </ul>
          </div>
        </section>

        <section className="ent-section" aria-labelledby="ent-workflows-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Workflows</p>
            <h2 className="ent-h2" id="ent-workflows-title">
              Two workflows. One research stack.
            </h2>
            <p className="ent-lede">
              Creative media generation and intelligent agents share Lugemi&apos;s first-party models
              and African language registry — then extend into LATAM, Southeast Asia, the Middle East,
              and the EU.
            </p>
            <div className="ent-split">
              <article>
                <h3>LugemiCreative</h3>
                <p>
                  Echo Voice delivers emotional depth and rich delivery for TTS, dubbing, and studio
                  production. Pair Baobab Translate for long-context, dialect-aware localization
                  before you publish.
                </p>
                <ul className="ent-model-tags" aria-label="Creative models">
                  <li>Echo Voice</li>
                  <li>Baobab Translate</li>
                  <li>own:* voices</li>
                </ul>
              </article>
              <article>
                <h3>LugemiAgents</h3>
                <p>
                  Resolve customer issues, automate scheduling, and deliver accurate support —
                  grounded in your knowledge base, tailored to your workflows, and spoken back in
                  the caller&apos;s language with Atlas Reason for complex dialect tasks.
                </p>
                <ul className="ent-model-tags" aria-label="Agent models">
                  <li>Atlas Reason</li>
                  <li>Echo Voice</li>
                  <li>Language Integrity</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="ent-section ent-section-navy" aria-labelledby="ent-security-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Security &amp; infrastructure</p>
            <h2 className="ent-h2" id="ent-security-title">
              Enterprise-grade controls for language AI at scale
            </h2>
            <div className="ent-feature-list">
              <article>
                <h3>Enterprise-level data protection</h3>
                <p>
                  Retention days, source-text persistence, and vendor-training flags live under Data
                  settings. Audit events, API key governance, and Language Integrity review paths keep
                  generative speech accountable — without inventing certifications we have not
                  published.
                </p>
              </article>
              <article>
                <h3>Built for large organizations</h3>
                <p>
                  SSO and RBAC for enterprise workspaces, unlimited seats on the Enterprise plan,
                  residency pins across Africa / US / EU islands, and dedicated capacity when
                  concurrency matters.
                </p>
              </article>
              <article>
                <h3>Elevated support and custom deployments</h3>
                <p>
                  Priority support, custom SLA packaging, and hands-on deployment assistance so
                  Lugemi voice, translate, and agents deliver impact from day one in your environment.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="ent-section" aria-labelledby="ent-plan-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Enterprise plan</p>
            <h2 className="ent-h2" id="ent-plan-title">
              {enterprisePlan.name} entitlements
            </h2>
            <p className="ent-lede">
              {enterprisePlan.blurb} {enterprisePlan.characterQuota.toLocaleString()} characters /
              month · unlimited workspaces · custom pricing.
            </p>
            <dl className="ent-entitlements">
              {ENTITLEMENTS.map((item) => (
                <div key={item.key}>
                  <dt>{FEATURE_LABELS[item.key] ?? item.key}</dt>
                  <dd>{item.body}</dd>
                </div>
              ))}
            </dl>
            <div className="ent-cta-row">
              <Link href="/billing" className="vl-btn vl-btn-primary">
                Upgrade on Billing
              </Link>
              <Link href="/enterprise/console" className="vl-btn vl-btn-secondary">
                Open Enterprise console
              </Link>
            </div>
          </div>
        </section>

        <section className="ent-section ent-section-mist" aria-labelledby="ent-integrations-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Integrations</p>
            <h2 className="ent-h2" id="ent-integrations-title">
              Connect the tools you already use
            </h2>
            <p className="ent-lede">
              Wire Lugemi into CRM, support desk, calendar, payments, and telephony. Platform
              connectors ship with install state in the console — Twilio, HubSpot, Salesforce, Slack,
              Stripe, and contact-center stacks.
            </p>
            <div className="ent-integrations">
              {INTEGRATIONS.map((item) => (
                <article key={item.name}>
                  <h3>{item.name}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <div className="ent-cta-row">
              <Link href="/connectors" className="mkt-text-link">
                Browse connectors →
              </Link>
              <Link href="/p/integrations" className="mkt-text-link">
                Integrations overview →
              </Link>
            </div>
          </div>
        </section>

        <section className="ent-section" aria-labelledby="ent-support-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Partnership</p>
            <h2 className="ent-h2" id="ent-support-title">
              Give your organization a voice
            </h2>
            <p className="ent-lede">
              Proprietary Lugemi research, seamless integration, and packaging that scales with
              African and global multilingual growth.
            </p>
            <div className="ent-support-grid">
              <article>
                <h3>Contact sales</h3>
                <p>
                  Partner with our team on tailored voice and language solutions — automation,
                  engagement, and language integrity for your markets.
                </p>
              </article>
              <article>
                <h3>Deployment assistance</h3>
                <p>
                  Hands-on guidance to integrate, customize, and optimize Lugemi speech and agents so
                  they deliver real impact from day one.
                </p>
              </article>
              <article>
                <h3>Ongoing support</h3>
                <p>
                  Continuous updates, expert assistance, and proactive optimizations as your workloads
                  and language coverage expand.
                </p>
              </article>
            </div>
            <div className="ent-cta-row">
              <Link href="/p/about" className="vl-btn vl-btn-primary">
                Contact sales
              </Link>
            </div>
          </div>
        </section>

        <section className="ent-section ent-section-mist" aria-labelledby="ent-faq-title">
          <div className="ent-wrap">
            <p className="ent-kicker">FAQ</p>
            <h2 className="ent-h2" id="ent-faq-title">
              Frequently asked questions
            </h2>
            <div className="ent-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ent-banner" aria-labelledby="ent-banner-title">
          <div className="ent-wrap">
            <h2 id="ent-banner-title">Africa-first language intelligence for the enterprise</h2>
            <p>
              Start on Free, Pro, or Business — or talk to sales about SSO, dedicated capacity, and
              custom SLA packaging on Enterprise.
            </p>
            <div className="ent-cta-row">
              <Link href="/sign-up" className="vl-btn vl-btn-primary">
                Get started
              </Link>
              <Link href="/p/about" className="vl-btn ent-btn-ghost">
                Talk to sales
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter footer={content.footer} brand={content.brand} />
    </div>
  );
}

import Link from 'next/link';
import { Syne } from 'next/font/google';
import { MarketingFooter } from './marketing-footer';
import { MarketingNav } from './nav';
import { PilotRequestForm } from './pilot-request-form';
import type { CmsDocument } from '@/data/cms-types';
import './enterprise.css';
import './organizations.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-syne',
  display: 'swap',
});

const OFFERS = [
  {
    title: 'Listen in your language',
    body: 'Any meeting, briefing, or announcement — heard live on a phone in Twi, Hausa, Ewe, Swahili, and more. Participants open a link and choose their language. No headset booth required.',
    examples: ['Community consultations', 'Town halls', 'Training sessions'],
  },
  {
    title: 'One message, every language',
    body: 'Write a health, safety, or aid message once. Lugemi turns it into native-sounding audio and text for radio, WhatsApp, SMS, and phone calls in every language your programme reaches.',
    examples: ['Vaccination campaigns', 'Distribution notices', 'Emergency alerts'],
  },
  {
    title: 'Documents with a human check',
    body: 'Machine translation that follows your official terminology, then a native-speaking editor approves the final text. Fast where it can be, careful where it must be.',
    examples: ['Reports and briefs', 'Forms and consent', 'Public guidance'],
  },
];

const AUDIENCES = [
  'UN agencies & programmes',
  'Humanitarian NGOs',
  'Ministries & public health',
  'Regional bodies',
  'Foundations & donors',
  'Universities & schools',
];

const PILOT_STEPS = [
  {
    title: 'Pick one programme',
    body: 'A single campaign, meeting series, or document set — and the two or three local languages that matter most to it.',
  },
  {
    title: 'Native voice check',
    body: 'Native speakers from your region listen and rate every voice before anything reaches the public. If it sounds foreign, it does not ship.',
  },
  {
    title: 'Run it for real',
    body: 'Your team uses Lugemi on live work for a few weeks, with interpreters and editors in the loop.',
  },
  {
    title: 'Measure what changed',
    body: 'Reach, comprehension, turnaround time, and cost per language — reported plainly so you can decide what to scale.',
  },
];

const LANGUAGE_GROUPS = [
  {
    region: 'Ghana — collecting native recordings now',
    status: 'now',
    languages: ['Asante Twi', 'Akuapem Twi', 'Fante', 'Ewe', 'Ga', 'Dagbani', 'Ghanaian English'],
  },
  {
    region: 'Next across Africa',
    status: 'next',
    languages: [
      'Yoruba',
      'Hausa',
      'Igbo',
      'Nigerian Pidgin',
      'Swahili (Kenya)',
      'Swahili (Tanzania)',
      'isiZulu',
      'isiXhosa',
      'Amharic',
      'Wolof',
    ],
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Does Lugemi replace interpreters and translators?',
    a: 'No. Lugemi helps interpreters and editors reach languages they could never staff for every meeting or message. For high-stakes work, a human reviews and approves the output; Lugemi makes that review faster and extends it to more languages.',
  },
  {
    q: 'Why do your voices sound local and not foreign?',
    a: 'Every Lugemi voice for a language is built from recordings of native speakers of that language and dialect, collected with written consent and reviewed by people from that community. When a native voice is not ready yet, Lugemi says so instead of reading the text in a foreign accent.',
  },
  {
    q: 'Can you support a language that is not on your list?',
    a: 'Yes — tell us in the pilot form. We recruit native speakers from that community, record them with consent, and have local reviewers approve the voice before it is used. Speakers can withdraw and have their recordings deleted at any time.',
  },
  {
    q: 'Where is our data stored?',
    a: 'Lugemi runs regional deployments — Africa-first (Johannesburg), plus the US and EU. Your organisation can pin a data region, set retention, and keep audit logs of who accessed what.',
  },
  {
    q: 'What does a pilot cost?',
    a: 'Pilot terms are scoped with each organisation around one programme and a small set of languages. Tell us about your timeline and budget constraints in the form and we will propose something that fits.',
  },
];

export function OrganizationsMarketingPage({ content }: { content: CmsDocument }) {
  return (
    <div className={`ent org ${syne.variable}`}>
      <a className="ent-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav nav={content.nav} />
      <main id="main">
        <section className="ent-hero" aria-labelledby="org-hero-title">
          <div className="ent-hero-visual" aria-hidden="true">
            <div className="ent-hero-orb" />
          </div>
          <div className="ent-wrap ent-hero-copy">
            <p className="org-eyebrow">Lugemi for organisations</p>
            <h1 id="org-hero-title">
              <span className="ent-headline org-headline">
                Reach people in the language they think in.
              </span>
            </h1>
            <p className="ent-lead">
              International institutions work in a handful of official languages. The people they
              serve speak thousands. Lugemi brings your meetings, messages, and documents into local
              languages — spoken by native voices, never a foreign accent.
            </p>
            <div className="ent-cta-row">
              <a href="#pilot" className="vl-btn vl-btn-primary">
                Request a pilot
              </a>
              <a href="#offers" className="vl-btn ent-btn-ghost">
                See what we offer
              </a>
            </div>
          </div>
        </section>

        <section className="ent-section" aria-labelledby="org-gap-title">
          <div className="ent-wrap">
            <p className="ent-kicker">The gap</p>
            <h2 className="ent-h2" id="org-gap-title">
              Six official languages. Thousands spoken where the work happens.
            </h2>
            <div className="org-gap">
              <div className="org-gap-stat">
                <strong>6</strong>
                <span>official languages at the United Nations</span>
              </div>
              <div className="org-gap-stat">
                <strong>2,000+</strong>
                <span>languages spoken across Africa alone</span>
              </div>
              <p className="org-gap-copy">
                Health workers, aid teams, and public servants reach communities in Twi, Hausa,
                Dagbani, Somali, Tigrinya, Lingala, and hundreds of other languages that no
                interpretation booth covers. When a message arrives in a language people only half
                understand — or in a voice that sounds foreign — trust drops and so does action.
              </p>
            </div>
          </div>
        </section>

        <section className="ent-section ent-section-mist" id="offers" aria-labelledby="org-offers-title">
          <div className="ent-wrap">
            <p className="ent-kicker">What we offer</p>
            <h2 className="ent-h2" id="org-offers-title">
              Three simple ways to use Lugemi
            </h2>
            <div className="org-offers">
              {OFFERS.map((offer) => (
                <article key={offer.title} className="org-offer">
                  <h3>{offer.title}</h3>
                  <p>{offer.body}</p>
                  <ul className="ent-model-tags" aria-label={`${offer.title} examples`}>
                    {offer.examples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ent-section" aria-labelledby="org-audience-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Who it is for</p>
            <h2 className="ent-h2" id="org-audience-title">
              Built for organisations that serve communities
            </h2>
            <ul className="ent-trust-row" aria-label="Organisation types">
              {AUDIENCES.map((audience) => (
                <li key={audience}>{audience}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ent-section ent-section-navy" aria-labelledby="org-native-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Our promise</p>
            <h2 className="ent-h2" id="org-native-title">
              Native, or nothing
            </h2>
            <div className="ent-feature-list">
              <article>
                <h3>Voices from the community itself</h3>
                <p>
                  Each language is spoken by voices built from native speakers of that language and
                  dialect — an Asante Twi message sounds like someone from Kumasi, not a visitor
                  reading phonetically.
                </p>
              </article>
              <article>
                <h3>Consent and control for every speaker</h3>
                <p>
                  Speakers sign a clear consent, can withdraw at any time, and have their recordings
                  deleted on request. Local reviewers approve each voice before it is used.
                </p>
              </article>
              <article>
                <h3>Honest when a voice is not ready</h3>
                <p>
                  If a native voice for a language does not exist yet, Lugemi says so instead of
                  faking an accent. You always know what you are getting.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="ent-section" aria-labelledby="org-pilot-steps-title">
          <div className="ent-wrap">
            <p className="ent-kicker">How a pilot works</p>
            <h2 className="ent-h2" id="org-pilot-steps-title">
              Start small, measure, then scale
            </h2>
            <ol className="org-steps">
              {PILOT_STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="org-step-num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="ent-section ent-section-mist" aria-labelledby="org-languages-title">
          <div className="ent-wrap">
            <p className="ent-kicker">Languages</p>
            <h2 className="ent-h2" id="org-languages-title">
              Starting in Ghana, growing across Africa
            </h2>
            <p className="ent-lede">
              We add languages the right way — with native speakers, consent, and local review — so
              each one sounds like home. Need a language that is not listed? Ask in the pilot form.
            </p>
            <div className="org-languages">
              {LANGUAGE_GROUPS.map((group) => (
                <div key={group.region} className={`org-language-group org-language-${group.status}`}>
                  <h3>{group.region}</h3>
                  <ul aria-label={group.region}>
                    {group.languages.map((language) => (
                      <li key={language}>{language}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ent-section" id="pilot" aria-labelledby="org-pilot-title">
          <div className="ent-wrap org-pilot">
            <div className="org-pilot-intro">
              <p className="ent-kicker">Request a pilot</p>
              <h2 className="ent-h2" id="org-pilot-title">
                Tell us who you need to reach
              </h2>
              <p className="ent-lede">
                Share your programme and the languages your communities speak. We reply within a few
                working days with a proposed pilot.
              </p>
            </div>
            <PilotRequestForm />
          </div>
        </section>

        <section className="ent-section ent-section-mist" aria-labelledby="org-faq-title">
          <div className="ent-wrap">
            <p className="ent-kicker">FAQ</p>
            <h2 className="ent-h2" id="org-faq-title">
              Questions organisations ask
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

        <section className="ent-banner" aria-labelledby="org-banner-title">
          <div className="ent-wrap">
            <h2 id="org-banner-title">Every community deserves to be spoken to in its own voice</h2>
            <p>
              Start with one programme and a few languages. We will help you prove the difference it
              makes.
            </p>
            <div className="ent-cta-row">
              <a href="#pilot" className="vl-btn vl-btn-primary">
                Request a pilot
              </a>
              <Link href="/enterprise" className="vl-btn ent-btn-ghost">
                Enterprise plan
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter footer={content.footer} brand={content.brand} />
    </div>
  );
}

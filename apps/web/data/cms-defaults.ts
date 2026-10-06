import type { CmsDocument, CmsPage } from './cms-types';

const API_SNIPPET = `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
});

const speech = await client.speech({
  text: 'Habari, dunia.',
  voice: 'own:sw-ke-female',
});`;

function page(
  partial: Omit<CmsPage, 'showInFooter'> & { showInFooter?: boolean },
): CmsPage {
  return { showInFooter: true, ...partial };
}

/** Seed CMS document — Admin edits persist to cms-store.json over these defaults. */
export const CMS_DEFAULTS: CmsDocument = {
  version: 1,
  updatedAt: new Date().toISOString(),
  brand: {
    name: 'Lugemi',
    domain: 'lugemi.com',
    tagline: 'Next-generation language intelligence for speaking agents.',
    positioning:
      'Developers build AI agents that speak and talk across languages and accents — with cultural understanding of countries, ethnic groups, and tribes. Africa-first completeness; LATAM, SEA, Middle East, and the EU in scope. Own API and own models.',
  },
  nav: {
    centerLinks: [
      { label: 'Products', href: '/#products' },
      { label: 'Hubs', href: '/#hubs' },
      { label: 'Use cases', href: '/#use-cases' },
      { label: 'Research', href: '/p/research' },
      { label: 'Safety', href: '/p/safety' },
      { label: 'Docs', href: '/docs' },
    ],
    actions: {
      console: { label: 'Open console', href: '/dashboard' },
      login: { label: 'Log in', href: '/sign-in' },
      signup: { label: 'Sign up', href: '/sign-up' },
    },
  },
  hero: {
    eyebrow: "Africa's voice, speech, and language platform",
    brand: 'Lugemi',
    headline: 'Own every African voice.',
    lead:
      'Speak, translate, and ship first-party speaking agents across African languages, accents, and cultural contexts — then into LATAM, Southeast Asia, the Middle East, and the EU. Our API and our models, not a vendor wrapper.',
    primaryCta: { label: 'Start free', href: '/sign-up' },
    secondaryCta: { label: 'Open console', href: '/dashboard' },
    media: { alt: 'Lugemi hero atmosphere' },
    demo: {
      title: 'Text to speech',
      badge: 'Interactive demo',
      defaultText:
        'Lugemi voices carry creative work, customer conversations, and public speech with literacy and presence across African languages.',
      playHint:
        'No autoplay. Play explains the generation path — it does not invent waveforms or audio levels.',
      voices: [
        { id: 'abe', label: 'Abe · Lagos' },
        { id: 'amara', label: 'Amara · Nairobi' },
        { id: 'thandi', label: 'Thandi · Johannesburg' },
        { id: 'kwame', label: 'Kwame · Accra' },
      ],
    },
  },
  languageBar: {
    languages: [
      'English',
      'French',
      'Swahili',
      'Zulu',
      'Amharic',
      'Oromo',
      'Igbo',
      'Twi',
      'Hausa',
      'Afrikaans',
      'Arabic',
      'Somali',
      'Yoruba',
      'Portuguese',
    ],
  },
  products: {
    kicker: 'Products',
    title: 'One platform for African voice, speech, and language.',
    lede: 'Voice, speech, and translation on the same first-party foundation — the stack developers use to ship speaking agents with cultural context. Availability follows the published coverage matrix.',
    items: [
      {
        id: 'voice',
        tag: 'Text-to-speech',
        name: 'Lugemi Voice',
        body: 'Resonant, region-aware speech and consent-gated cloning — the sound layer for creative work and speaking agents.',
        href: '/p/lugemi-voice',
        art: 'voice',
      },
      {
        id: 'speech',
        tag: 'Speech-to-text',
        name: 'Lugemi Speech',
        body: 'Transcribe accents, dialects, and code-switching with research intelligence built for African and global languages.',
        href: '/p/lugemi-speech',
        art: 'speech',
      },
      {
        id: 'translate',
        tag: 'Translation',
        name: 'Lugemi Translate',
        body: 'Move meaning across languages without flattening cultural nuance — registry-backed, reviewable, and metered.',
        href: '/p/lugemi-translate',
        art: 'translate',
      },
    ],
  },
  useCases: {
    kicker: 'Use cases',
    title: 'Why teams choose Lugemi',
    lede: 'Built for the conversations that move African markets — and the global corridors that connect them.',
    items: [
      {
        title: 'Trade & negotiations',
        body: 'Close deals in the languages partners actually speak — with tone that holds trust.',
        tone: 'gold',
        art: 'agents',
      },
      {
        title: 'Education',
        body: 'Teach and tutor across mother tongues so literacy and STEM travel further.',
        tone: 'blue',
        art: 'speech',
      },
      {
        title: 'Sales & marketing',
        body: 'Localize campaigns and product voice without flattening cultural nuance.',
        tone: 'rose',
        art: 'translate',
      },
      {
        title: 'Public speech',
        body: 'Civic address, broadcast, and advocacy that sound native, not dubbed.',
        tone: 'teal',
        art: 'voice',
      },
      {
        title: 'Customer experience',
        body: 'Support and IVR that understand accents, switches, and regional phrasing.',
        tone: 'green',
        art: 'agents',
      },
      {
        title: 'Creative voice',
        body: 'Agencies and creators ship narration, ads, and character voices at production pace.',
        tone: 'violet',
        art: 'api',
      },
    ],
  },
  hubs: {
    kicker: 'Hubs',
    title: 'Three ways to ship',
    lede: 'Creative studio, conversational agents, or raw API — pick the surface that matches your stack.',
    items: [
      {
        title: 'Creative',
        body: 'Lugemi Studio for scripts, voices, localization, and review before publish.',
        tags: ['TTS', 'STT', 'Films', 'Ads', 'Clone'],
        href: '/p/lugemi-studio',
      },
      {
        title: 'Agents',
        body: 'First-party speaking agents that listen, reason, and reply aloud with cultural context.',
        tags: ['Voice agents', 'Support', 'Hotlines', 'FAQ'],
        href: '/p/lugemi-agents',
      },
      {
        title: 'API',
        body: 'Ship with @lugemi/sdk, Bearer lg_live_ keys, and metered speech + translate endpoints.',
        tags: ['TTS', 'STT', 'SDK', 'Web', 'REST'],
        href: '/docs',
      },
    ],
  },
  creative: {
    kicker: 'Lugemi Creative',
    title: 'Create, edit, and localize every African voice',
    lede: 'Lugemi Studio is the authenticated console for scripts, voices, and review. Surfaces below are illustrative — not live sessions.',
    features: [
      { title: 'Script studio', body: 'Draft, localize, and review narration before it ships.' },
      { title: 'Voice library', body: 'Region-aware own:* voices with synthetic disclosure.' },
      { title: 'Consent clones', body: 'Authorization-gated cloning with review and disable paths.' },
      { title: 'Language chips', body: 'Pick registry languages per take — availability stays honest.' },
    ],
    moduleTitle: 'Lugemi Studio',
    moduleBody:
      'Draft narration, pick registry languages, and review synthetic disclosure before publish. Speech and clone paths open after sign-up.',
    moduleCta: { label: 'Open Studio', href: '/sign-up' },
    studioSample:
      'Habari — your brand can speak to customers in Swahili, Yoruba, and French from one draft.',
    languageChips: ['English', 'Swahili', 'Yoruba', 'French', 'Amharic'],
  },
  agents: {
    kicker: 'Lugemi Agents',
    title: 'Deploy agents that talk, type, and act',
    lede: 'First-party speaking agents for developers — listen, reason, and reply aloud with cultural understanding of countries, ethnic groups, and tribes.',
    features: [
      { title: 'Voice FAQ', body: 'STT → model → TTS turns for support and civic desks.' },
      { title: 'Cultural context', body: 'Country, ethnic, and accent metadata on every agent.' },
      { title: 'Simulate API', body: 'POST /v1/voice/simulate for sandbox speaking turns.' },
      { title: 'Inbound hooks', body: 'Twilio-ready paths for hotlines and call flows.' },
    ],
    moduleTitle: 'Speaking agents',
    moduleBody:
      'Simulate turns via POST /v1/voice/simulate or open Agent Runtime in the console. Africa-first completeness is the investment priority.',
    moduleCta: { label: 'Open Agents', href: '/voice' },
    transcriptTitle: 'Agent transcript · East Africa trade desk',
    transcriptUser: 'Habari — naweza kupata bei za usafirishaji?',
    transcriptAgent: 'Karibu. Ninaweza kukusaidia na bei, malipo, na ratiba ya usafirishaji.',
  },
  api: {
    kicker: 'Lugemi API',
    title: 'Or build anything with Lugemi APIs',
    lede: 'Install @lugemi/sdk and authenticate with Authorization: Bearer lg_live_.... First-party endpoints for speech, translate, detect, and voice simulate.',
    tabs: [
      { label: 'Speech', href: '/docs' },
      { label: 'Transcribe', href: '/docs' },
      { label: 'Playground', href: '/playground' },
      { label: 'REST', href: '/docs' },
    ],
    primaryCta: { label: 'Explore docs', href: '/docs' },
    secondaryCta: { label: 'Playground', href: '/playground' },
    snippet: API_SNIPPET,
  },
  impact: {
    kicker: 'Impact',
    title: 'Infrastructure with a mission',
    lede: '',
    items: [
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
    ],
  },
  research: {
    kicker: 'Research',
    title: 'Research timeline',
    lede: 'Milestones that shaped the platform. Coverage remains per language and task — see the public matrix.',
    items: [
      {
        year: '2023',
        title: 'African Language Registry',
        body: 'Seed languages, scripts, and task metadata for honest coverage claims.',
      },
      {
        year: '2024',
        title: 'Cultural intelligence',
        body: 'Dialect and accent metadata wired into speech and translation review paths.',
      },
      {
        year: '2025',
        title: 'First-party voice',
        body: 'own:* voices and API keys as the intended production route — not a wrapper stack.',
      },
      {
        year: 'Now',
        title: 'Lugemi platform',
        body: 'Studio, Agents, and API on one foundation with published per-task availability.',
      },
    ],
    cta: { label: 'View language coverage', href: '/coverage' },
  },
  safety: {
    kicker: 'Safety',
    title: 'Safety by design',
    lede: 'Controls that exist in product paths today. We do not display SOC 2 or similar badges without published evidence.',
    items: [
      {
        title: 'Moderation',
        body: 'Policy checks on generative speech paths so misuse surfaces before scale.',
      },
      {
        title: 'Accountability',
        body: 'Workspace keys, usage logs, and review states for clones and translations.',
      },
      {
        title: 'Provenance',
        body: 'Synthetic-speech disclosure and watermarking on clone voices where required.',
      },
      {
        title: 'Biometrics',
        body: 'Consent gates for voice cloning — authorization is required, not assumed.',
      },
    ],
  },
  updates: {
    kicker: 'Latest on the platform',
    title: 'Product in build',
    lede: '',
    items: [
      {
        title: 'Public language coverage',
        body: 'A coverage page lands so homepage CTAs point at real availability, not slogans.',
      },
      {
        title: 'First-party positioning',
        body: 'Product copy states Lugemi owns the API and models — not Google, OpenAI,  wrappers.',
      },
      {
        title: 'Speaking agents',
        body: 'Developers ship agents that talk across languages, accents, and cultural contexts from one foundation.',
      },
    ],
  },
  banner: {
    title: "Africa's AI communication platform",
    body: 'Start creating with Lugemi Voice, Speech, and Translate — or talk to us about your workspace.',
    primaryCta: { label: 'Start building', href: '/sign-up' },
    secondaryCta: { label: 'Talk to us', href: '/p/about' },
  },
  footer: {
    mission:
      'Global language intelligence. Africa first. First-party API and models for voice, speech, translation, and speaking agents.',
    columns: [
      {
        id: 'product',
        title: 'Product',
        links: [
          { label: 'Lugemi Studio', href: '/p/lugemi-studio' },
          { label: 'Lugemi Voice', href: '/p/lugemi-voice' },
          { label: 'Lugemi Speech', href: '/p/lugemi-speech' },
          { label: 'Lugemi Translate', href: '/p/lugemi-translate' },
          { label: 'Lugemi Agents', href: '/p/lugemi-agents' },
        ],
      },
      {
        id: 'developers',
        title: 'Developers',
        links: [
          { label: 'API reference', href: '/docs' },
          { label: 'Lugemi API', href: '/p/lugemi-api' },
          { label: 'Playground', href: '/playground' },
          { label: 'Developer hub', href: '/developers' },
          { label: 'Models', href: '/models' },
        ],
      },
      {
        id: 'solutions',
        title: 'Solutions',
        links: [
          { label: 'Trade', href: '/p/trade' },
          { label: 'Education', href: '/p/education' },
          { label: 'Customer experience', href: '/p/customer-experience' },
          { label: 'Creative', href: '/p/creative' },
          { label: 'Agents', href: '/p/lugemi-agents' },
        ],
      },
      {
        id: 'resources',
        title: 'Resources',
        links: [
          { label: 'Docs', href: '/docs' },
          { label: 'Coverage', href: '/coverage' },
          { label: 'Research', href: '/p/research' },
          { label: 'Safety', href: '/p/safety' },
          { label: 'Latest updates', href: '/p/updates' },
        ],
      },
      {
        id: 'socials',
        title: 'Socials',
        links: [
          { label: 'lugemi.com', href: 'https://lugemi.com' },
          { label: 'X — channel opens after brand launch', href: '/p/socials' },
          { label: 'LinkedIn — channel opens after brand launch', href: '/p/socials' },
        ],
      },
      {
        id: 'company',
        title: 'Company',
        links: [
          { label: 'About', href: '/p/about' },
          { label: 'Log in', href: '/sign-in' },
          { label: 'Sign up', href: '/sign-up' },
          { label: 'Safety', href: '/p/safety' },
          { label: 'Policies', href: '/p/policies' },
          { label: 'Open console', href: '/dashboard' },
        ],
      },
    ],
    copyright: '© Lugemi. All rights reserved.',
    metaNote: ' · Africa-first language intelligence · every country, every community',
    supportFab: { label: 'Chat for support', href: '/sign-up' },
  },
  mediaLibrary: [],
  pages: [
    page({
      slug: 'lugemi-studio',
      title: 'Lugemi Studio',
      eyebrow: 'Creative',
      lead: 'Scripts, voices, localization, and review in one authenticated console — before speech ships.',
      body: 'Lugemi Studio is where creators and localization teams draft narration, pick registry languages, apply consent-gated clones, and review synthetic disclosure. Open the console after sign-up to generate with own:* voices.',
      sections: [
        {
          id: 'scripts',
          title: 'Script studio',
          body: 'Draft, localize, and review narration with language chips tied to the published coverage matrix.',
        },
        {
          id: 'voices',
          title: 'Voice library',
          body: 'Region-aware own:* voices with cultural metadata — not a vendor wrapper catalog.',
        },
        {
          id: 'clones',
          title: 'Consent clones',
          body: 'Authorization-gated cloning with review, approve, reject, and disable paths.',
        },
      ],
      primaryCta: { label: 'Open Studio', href: '/sign-up' },
      secondaryCta: { label: 'Voice console', href: '/audio' },
      footerColumn: 'product',
    }),
    page({
      slug: 'lugemi-voice',
      title: 'Lugemi Voice',
      eyebrow: 'Text-to-speech',
      lead: 'Resonant, region-aware speech and consent-gated cloning for creative work and speaking agents.',
      body: 'Lugemi Voice is the sound layer of the platform. Generate speech with first-party own:* voices, disclose synthetic output where required, and connect the same voices into Studio and Agents.',
      sections: [
        {
          id: 'tts',
          title: 'Text to speech',
          body: 'Produce narration and agent replies with Africa-first accents and honest availability.',
        },
        {
          id: 'cloning',
          title: 'Voice cloning',
          body: 'Consent-gated clones with workspace review — authorization is required, not assumed.',
        },
      ],
      primaryCta: { label: 'Open Voice', href: '/audio' },
      secondaryCta: { label: 'Start free', href: '/sign-up' },
      footerColumn: 'product',
    }),
    page({
      slug: 'lugemi-speech',
      title: 'Lugemi Speech',
      eyebrow: 'Speech-to-text',
      lead: 'Transcribe accents, dialects, and code-switching built for African and global languages.',
      body: 'Lugemi Speech turns spoken audio into text that respects regional phrasing. Pair STT with Translate and Agents for end-to-end speaking-agent pipelines.',
      sections: [
        {
          id: 'stt',
          title: 'Transcription',
          body: 'Accents, dialects, and switches are first-class — not edge cases.',
        },
        {
          id: 'pipeline',
          title: 'Agent pipelines',
          body: 'STT feeds FAQ and agent runtimes so replies can go back out as voice.',
        },
      ],
      primaryCta: { label: 'Open Speech', href: '/speech' },
      secondaryCta: { label: 'Coverage', href: '/coverage' },
      footerColumn: 'product',
    }),
    page({
      slug: 'lugemi-translate',
      title: 'Lugemi Translate',
      eyebrow: 'Translation',
      lead: 'Move meaning across languages without flattening cultural nuance.',
      body: 'Registry-backed translation with review, glossaries, and metering. Built for African languages first, with the same API surface for LATAM, SEA, the Middle East, and the EU.',
      sections: [
        {
          id: 'registry',
          title: 'Language registry',
          body: 'Pairs and tasks publish honestly — catalog membership is not a quality certificate.',
        },
        {
          id: 'review',
          title: 'Human review',
          body: 'Workspace review paths keep high-stakes copy accountable.',
        },
      ],
      primaryCta: { label: 'Open Translate', href: '/translate' },
      secondaryCta: { label: 'Playground', href: '/playground' },
      footerColumn: 'product',
    }),
    page({
      slug: 'lugemi-agents',
      title: 'Lugemi Agents',
      eyebrow: 'Speaking agents',
      lead: 'Deploy agents that listen, reason, and reply aloud with cultural context.',
      body: 'First-party speaking agents for developers. Simulate Voice FAQ turns, configure Agent Runtime permissions, and ship hotlines that understand countries, ethnic groups, and tribes.',
      sections: [
        {
          id: 'faq',
          title: 'Voice FAQ',
          body: 'STT → model → TTS turns for support, trade desks, and civic helpers.',
        },
        {
          id: 'runtime',
          title: 'Agent Runtime',
          body: 'Sandbox agents with hard permission allowlists before production.',
        },
        {
          id: 'simulate',
          title: 'Simulate API',
          body: 'POST /v1/voice/simulate for sandbox speaking turns with Bearer lg_live_ keys.',
        },
      ],
      primaryCta: { label: 'Open Agents', href: '/voice' },
      secondaryCta: { label: 'Docs', href: '/docs' },
      footerColumn: 'product',
    }),
    page({
      slug: 'lugemi-api',
      title: 'Lugemi API',
      eyebrow: 'Developers',
      lead: 'Own endpoints and @lugemi/sdk — speech, translate, detect, voice simulate.',
      body: 'Authenticate with Authorization: Bearer lg_live_… or soft-sandbox lg_test_…. Production path is Lugemi endpoints and own:* voices — not a reseller wrapper.',
      sections: [
        {
          id: 'sdk',
          title: 'SDK',
          body: 'Install @lugemi/sdk and call speech, translate, and detect from TypeScript.',
        },
        {
          id: 'rest',
          title: 'REST',
          body: 'OpenAPI-documented routes under /v1 with workspace metering.',
        },
      ],
      primaryCta: { label: 'Explore docs', href: '/docs' },
      secondaryCta: { label: 'Playground', href: '/playground' },
      footerColumn: 'developers',
    }),
    page({
      slug: 'trade',
      title: 'Trade & negotiations',
      eyebrow: 'Solutions',
      lead: 'Close deals in the languages partners actually speak — with tone that holds trust.',
      body: 'Lugemi speaking agents and translation help trade desks operate across East Africa corridors, West African markets, and global partners without losing etiquette or clarity.',
      sections: [
        {
          id: 'voice',
          title: 'Voice trade desks',
          body: 'Bilingual agents that greet, quote, and escalate in Kiswahili, English, Hausa, and more.',
        },
        {
          id: 'docs',
          title: 'Documented deals',
          body: 'Translate contracts and product sheets with reviewable workspace controls.',
        },
      ],
      primaryCta: { label: 'Talk to us', href: '/sign-up' },
      secondaryCta: { label: 'Open Agents', href: '/voice' },
      footerColumn: 'solutions',
    }),
    page({
      slug: 'education',
      title: 'Education',
      eyebrow: 'Solutions',
      lead: 'Teach and tutor across mother tongues so literacy and STEM travel further.',
      body: 'Lugemi helps educators ship tutors and classroom audio that respect orthography, tone marks, and regional phrasing — from Yorùbá STEM to Amharic civic literacy.',
      sections: [
        {
          id: 'tutors',
          title: 'Speaking tutors',
          body: 'Agents that teach aloud with cultural context and mother-tongue first turns.',
        },
        {
          id: 'content',
          title: 'Localized content',
          body: 'Studio localization for lessons, assessments, and parent communication.',
        },
      ],
      primaryCta: { label: 'Start free', href: '/sign-up' },
      secondaryCta: { label: 'Coverage', href: '/coverage' },
      footerColumn: 'solutions',
    }),
    page({
      slug: 'customer-experience',
      title: 'Customer experience',
      eyebrow: 'Solutions',
      lead: 'Support and IVR that understand accents, switches, and regional phrasing.',
      body: 'Replace brittle IVR trees with Lugemi speaking agents that listen and reply in the languages your customers already use — with metering and review for production support desks.',
      sections: [
        {
          id: 'support',
          title: 'Support agents',
          body: 'Voice FAQ and escalation scripts tuned for African and global language communities.',
        },
        {
          id: 'ivr',
          title: 'Inbound voice',
          body: 'Twilio-ready paths for hotlines and call flows.',
        },
      ],
      primaryCta: { label: 'Open Agents', href: '/voice' },
      secondaryCta: { label: 'Talk to us', href: '/sign-up' },
      footerColumn: 'solutions',
    }),
    page({
      slug: 'creative',
      title: 'Creative voice',
      eyebrow: 'Solutions',
      lead: 'Agencies and creators ship narration, ads, and character voices at production pace.',
      body: 'Lugemi Studio gives creative teams region-aware voices, consent-gated clones, and localization chips — so campaigns sound native across African markets.',
      sections: [
        {
          id: 'ads',
          title: 'Ads & narration',
          body: 'Produce multilingual spots without flattening cultural nuance.',
        },
        {
          id: 'characters',
          title: 'Character voices',
          body: 'Consistent own:* personas with synthetic disclosure where required.',
        },
      ],
      primaryCta: { label: 'Open Studio', href: '/sign-up' },
      secondaryCta: { label: 'Lugemi Voice', href: '/p/lugemi-voice' },
      footerColumn: 'solutions',
    }),
    page({
      slug: 'research',
      title: 'Research',
      eyebrow: 'Resources',
      lead: 'Milestones that shaped Lugemi — with honest per-language coverage.',
      body: 'From the African Language Registry to first-party voice and the Lugemi platform, research feeds product paths. Coverage remains published per language and task.',
      sections: [
        {
          id: '2023',
          title: '2023 — African Language Registry',
          body: 'Seed languages, scripts, and task metadata for honest coverage claims.',
        },
        {
          id: '2024',
          title: '2024 — Cultural intelligence',
          body: 'Dialect and accent metadata wired into speech and translation review paths.',
        },
        {
          id: '2025',
          title: '2025 — First-party voice',
          body: 'own:* voices and API keys as the intended production route.',
        },
        {
          id: 'now',
          title: 'Now — Lugemi platform',
          body: 'Studio, Agents, and API on one foundation with published per-task availability.',
        },
      ],
      primaryCta: { label: 'View coverage', href: '/coverage' },
      secondaryCta: { label: 'Docs', href: '/docs' },
      footerColumn: 'resources',
    }),
    page({
      slug: 'safety',
      title: 'Safety',
      eyebrow: 'Resources',
      lead: 'Safety by design — controls that exist in product paths today.',
      body: 'Lugemi does not display compliance badges without published evidence. What we ship: moderation on generative speech, workspace accountability, synthetic provenance, and consent for biometrics.',
      sections: [
        {
          id: 'moderation',
          title: 'Moderation',
          body: 'Policy checks on generative speech paths so misuse surfaces before scale.',
        },
        {
          id: 'accountability',
          title: 'Accountability',
          body: 'Workspace keys, usage logs, and review states for clones and translations.',
        },
        {
          id: 'provenance',
          title: 'Provenance',
          body: 'Synthetic-speech disclosure and watermarking on clone voices where required.',
        },
        {
          id: 'biometrics',
          title: 'Biometrics',
          body: 'Consent gates for voice cloning — authorization is required, not assumed.',
        },
      ],
      primaryCta: { label: 'Policies', href: '/p/policies' },
      secondaryCta: { label: 'Talk to us', href: '/sign-up' },
      footerColumn: 'resources',
    }),
    page({
      slug: 'updates',
      title: 'Latest updates',
      eyebrow: 'Resources',
      lead: 'What is shipping on the Lugemi platform.',
      body: 'Product notes for coverage, first-party positioning, and speaking agents. Edit this page from Admin CMS anytime.',
      sections: [
        {
          id: 'coverage',
          title: 'Public language coverage',
          body: 'Homepage CTAs point at real availability via the coverage matrix.',
        },
        {
          id: 'first-party',
          title: 'First-party positioning',
          body: 'Lugemi owns the API and models — not a vendor wrapper story.',
        },
        {
          id: 'agents',
          title: 'Speaking agents',
          body: 'Developers ship agents that talk across languages, accents, and cultural contexts.',
        },
      ],
      primaryCta: { label: 'Start building', href: '/sign-up' },
      secondaryCta: { label: 'Open console', href: '/dashboard' },
      footerColumn: 'resources',
    }),
    page({
      slug: 'about',
      title: 'About Lugemi',
      eyebrow: 'Company',
      lead: 'Global language intelligence. Africa first.',
      body: 'Lugemi builds first-party API and models for voice, speech, translation, and speaking agents. African languages, accents, and cultural contexts are the investment priority; LATAM, Southeast Asia, the Middle East, and the EU share the same surface.',
      sections: [
        {
          id: 'mission',
          title: 'Mission',
          body: 'Own every African voice — then expand without abandoning the foundation.',
        },
        {
          id: 'domain',
          title: 'lugemi.com',
          body: 'The brand home for Studio, Agents, and API under Lugemi guidelines.',
        },
      ],
      primaryCta: { label: 'Start free', href: '/sign-up' },
      secondaryCta: { label: 'Contact', href: '/sign-up' },
      footerColumn: 'company',
    }),
    page({
      slug: 'policies',
      title: 'Policies',
      eyebrow: 'Company',
      lead: 'How Lugemi handles consent, synthetic speech, and workspace data.',
      body: 'Voice cloning requires authorization. Generated speech should be identifiable where it could be mistaken for a live person. Workspace keys and usage logs support accountability. Edit policy sections from Admin CMS as legal copy lands.',
      sections: [
        {
          id: 'consent',
          title: 'Consent for clones',
          body: 'Authorization is required before cloning a voice. Profiles can be reviewed, approved, rejected, or disabled.',
        },
        {
          id: 'disclosure',
          title: 'Synthetic disclosure',
          body: 'Mark generative speech where listeners could reasonably assume a live person.',
        },
        {
          id: 'coverage',
          title: 'Honest coverage',
          body: 'Availability is published per language and task. Catalog membership is not a quality certificate.',
        },
      ],
      primaryCta: { label: 'Safety', href: '/p/safety' },
      secondaryCta: { label: 'About', href: '/p/about' },
      footerColumn: 'company',
    }),
    page({
      slug: 'socials',
      title: 'Social channels',
      eyebrow: 'Company',
      lead: 'Public channels open after brand launch.',
      body: 'Follow lugemi.com for product updates. X and LinkedIn links will appear here once official channels launch — edit destinations anytime from Admin CMS.',
      sections: [
        {
          id: 'web',
          title: 'Website',
          body: 'https://lugemi.com — primary brand destination.',
        },
        {
          id: 'x',
          title: 'X',
          body: 'Channel opens after brand launch. Update the URL in Admin → CMS → Pages → socials.',
        },
        {
          id: 'linkedin',
          title: 'LinkedIn',
          body: 'Channel opens after brand launch. Update the URL in Admin → CMS → Pages → socials.',
        },
      ],
      primaryCta: { label: 'Visit lugemi.com', href: 'https://lugemi.com' },
      secondaryCta: { label: 'Latest updates', href: '/p/updates' },
      footerColumn: 'socials',
    }),
  ],
  console: {
    dashboardWelcome: {
      title: 'Welcome to Lugemi',
      lead: 'Build speaking agents across languages and accents with cultural context. Start from Voice Studio, Agent Runtime, or the API playground — Africa-first coverage is the investment priority.',
      starterCards: [
        {
          title: 'Ship a speaking agent',
          body: 'Simulate Voice FAQ turns or create a sandbox agent with permission allowlists.',
          href: '/voice',
        },
        {
          title: 'Generate speech',
          body: 'Try own:* voices in Voice Studio. Production path uses OWN_TTS_URL when configured.',
          href: '/audio',
        },
        {
          title: 'Call the API',
          body: 'Translate, detect, and speech via @lugemi/sdk with lg_live_ / lg_test_ keys.',
          href: '/playground',
        },
        {
          title: 'Browse Africa coverage',
          body: 'Countries, languages, scripts, and ethnic varieties in the curated catalog.',
          href: '/coverage',
        },
      ],
    },
    docsIntro: {
      title: 'Build speaking agents with the Lugemi API',
      lead: 'First-party language intelligence: generate speech, transcribe, translate, and simulate voice agents. Africa-first languages, dialects, accents, and cultural context; LATAM, Southeast Asia, the Middle East, and the EU in scope. Authenticate with Bearer lg_live_… or soft-sandbox lg_test_….',
    },
    playgroundDefaults: {
      text: 'Build AI agents that speak Kiswahili, Yorùbá, and Amharic with cultural context.',
      source: 'en',
      target: 'sw',
    },
    hubDefaults: {
      catalogTitle: 'Platform catalog',
      catalogLead:
        'Prefill catalog for this console surface. Live engine payloads appear below when the API is reachable. Edit defaults from Admin CMS.',
      items: [
        {
          id: 'speaking-agents',
          title: 'Speaking agents',
          body: 'Agents that listen and reply aloud across languages, accents, and cultural contexts.',
        },
        {
          id: 'africa-first',
          title: 'Africa-first completeness',
          body: 'Countries, ethnic groups, tribes, scripts, and dialects are first-class product metadata.',
        },
        {
          id: 'own-models',
          title: 'Own API & models',
          body: 'Production path is Lugemi endpoints and own:* voices — not a reseller wrapper story.',
        },
        {
          id: 'global-scope',
          title: 'Global scope',
          body: 'LATAM, Southeast Asia, the Middle East, and the EU share the same API surface.',
        },
      ],
    },
    samplePrompts: [
      {
        id: 'sw-greeting',
        label: 'Kiswahili greeting',
        text: 'Habari, karibu Lugemi. Naweza kukusaidia kwa sauti au maandishi.',
        language: 'sw',
      },
      {
        id: 'yo-market',
        label: 'Yorùbá market agent',
        text: 'Ẹ káàbọ̀. Mo lè sọ̀rọ̀ nípa àwọn ọjà, ìdíje, àti ìtọ́sọ́nà.',
        language: 'yo',
      },
      {
        id: 'am-civic',
        label: 'Amharic civic FAQ',
        text: 'ሰላም። ስለ አገልግሎቶች፣ ቀጠሮዎች እና ቋንቋ ድጋፍ መጠየቅ ይችላሉ።',
        language: 'am',
      },
      {
        id: 'en-agent',
        label: 'English speaking agent',
        text: 'Hello — I am your Lugemi speaking agent. Ask in the language you prefer; I will answer with the matching accent and cultural context.',
        language: 'en',
      },
    ],
    sampleVoices: [
      {
        id: 'sw-ke-female',
        label: 'Aisha · Nairobi',
        language: 'Kiswahili',
        region: 'Kenya',
        ethnicContext: 'Coastal & urban Kenyan Swahili',
        voiceId: 'own:sw-ke-female',
      },
      {
        id: 'yo-ng-male',
        label: 'Tunde · Lagos',
        language: 'Yorùbá',
        region: 'Nigeria',
        ethnicContext: 'Standard Lagos Yoruba',
        voiceId: 'own:yo-ng-male',
      },
      {
        id: 'am-et-female',
        label: 'Hanna · Addis',
        language: 'Amharic',
        region: 'Ethiopia',
        ethnicContext: 'Addis Ababa Amharic',
        voiceId: 'own:am-et-female',
      },
      {
        id: 'zu-za-female',
        label: 'Thandi · Durban',
        language: 'isiZulu',
        region: 'South Africa',
        ethnicContext: 'KwaZulu-Natal Zulu',
        voiceId: 'own:zu-za-female',
      },
      {
        id: 'ar-eg-male',
        label: 'Omar · Cairo',
        language: 'Egyptian Arabic',
        region: 'Egypt',
        ethnicContext: 'Cairene Arabic',
        voiceId: 'own:ar-eg-male',
      },
      {
        id: 'fr-sn-female',
        label: 'Awa · Dakar',
        language: 'French',
        region: 'Senegal',
        ethnicContext: 'Senegalese French',
        voiceId: 'own:fr-sn-female',
      },
    ],
    agentTemplates: [
      {
        id: 'trade-sw',
        name: 'East Africa trade desk',
        language: 'Kiswahili + English',
        accent: 'Nairobi / Dar',
        culturalContext: 'Kenya, Tanzania, Uganda — Swahili trade etiquette',
        script:
          'Karibu. Ninaweza kukusaidia na bei, malipo, na ratiba ya usafirishaji. Prefer English or Kiswahili?',
        goal: 'Answer trade FAQ turns aloud with bilingual code-switching.',
      },
      {
        id: 'edu-yo',
        name: 'Yorùbá STEM tutor',
        language: 'Yorùbá',
        accent: 'Lagos',
        culturalContext: 'Yoruba naming, tone marks, classroom respect forms',
        script: 'Ẹ káàárọ̀. Jẹ́ ká ṣiṣẹ́ lórí ìṣirò àti sáyẹ́ǹsì ní èdè Yorùbá.',
        goal: 'Tutor aloud with orthography-aware prompts.',
      },
      {
        id: 'civic-am',
        name: 'Horn civic helper',
        language: 'Amharic',
        accent: 'Addis Ababa',
        culturalContext: 'Ethiopia public-service phrasing and Geʽez script awareness',
        script: 'ሰላም። ስለ አገልግሎት ሰዓታት፣ ሰነዶች እና ቋንቋ ድጋፍ መጠየቅ ይችላሉ።',
        goal: 'Voice FAQ for civic hours and document guidance.',
      },
      {
        id: 'support-ha',
        name: 'Sahel support agent',
        language: 'Hausa + English',
        accent: 'Kano',
        culturalContext: 'Northern Nigeria / Niger — Hausa greeting norms',
        script: 'Sannu. Ina iya taimaka da tallafi na samfurin. English ko Hausa?',
        goal: 'Customer support turns with greeting and escalation scripts.',
      },
    ],
    apiSnippets: {
      speech: API_SNIPPET,
      translate: `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
});

const translated = await client.translate({
  text: 'Build speaking agents for every language.',
  source: 'en',
  target: 'sw',
});`,
      agentSimulate: `curl -X POST "$LUGEMI_BASE_URL/v1/voice/simulate" \\
  -H "Authorization: Bearer lg_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"text":"What languages can Lugemi agents speak?"}'`,
    },
  },
};

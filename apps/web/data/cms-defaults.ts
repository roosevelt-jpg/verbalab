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
        body: 'Product copy states Lugemi owns the API and models — not Google, OpenAI, wrappers.',
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
        {
          id: 'guide-studio',
          kind: 'guide',
          title: 'Studio workflow',
          body: 'From script to reviewable speech before anything ships publicly.',
          steps: [
            'Sign in and open Voice / Studio with an own:* sample.',
            'Localize the script with Translate defaults (English → Twi) or any locale.',
            'Review disclosure and consent before publishing generative speech.',
          ],
          links: [
            { label: 'Voice console', href: '/audio' },
            { label: 'Translate', href: '/translate' },
            { label: 'API docs', href: '/docs' },
          ],
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
        {
          id: 'guide-voice',
          kind: 'guide',
          title: 'Try it in 3 steps',
          body: 'Generate a sample, pick a region voice, then call the same path from your app.',
          steps: [
            'Open the Voice console and play an own:* sample.',
            'Attach consent samples only when cloning is authorized.',
            'Call POST /v1/speech/synthesize with an lg_live_ key or use the CLI / MCP SDKs.',
          ],
          links: [
            { label: 'Voice console', href: '/audio' },
            { label: 'Speech API', href: '/docs' },
            { label: 'SDKs & CLI', href: '/developers' },
          ],
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
        {
          id: 'guide-speech',
          kind: 'guide',
          title: 'Speech guide',
          body: 'Upload audio, transcribe, then hand off to Translate or Agents.',
          steps: [
            'Use the Speech console or POST /v1/speech/recognize.',
            'Pair transcripts with Translate for captions and dubbing scripts.',
            'Ship speaking agents that listen and reply aloud.',
          ],
          links: [
            { label: 'Speech console', href: '/speech' },
            { label: 'API docs', href: '/docs' },
            { label: 'SDKs', href: '/developers' },
          ],
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
        {
          id: 'guide-translate',
          kind: 'guide',
          title: 'Translate guide',
          body: 'Default panel pair is English → Twi (Akan, Ghana). Pick any locale from the dropdowns.',
          steps: [
            'Open Translate and keep English → Twi, or switch any locale code.',
            'Try the interactive demo on this page, then the Playground for API-shaped requests.',
            'Integrate POST /v1/translate or document jobs via /v1/documents/translate.',
          ],
          links: [
            { label: 'Translate console', href: '/translate' },
            { label: 'Playground', href: '/playground' },
            { label: 'API docs', href: '/docs' },
          ],
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
        {
          id: 'guide-agents',
          kind: 'guide',
          title: 'Agent integration guide',
          body: 'From transcript demo to production speaking agent.',
          steps: [
            'Play the transcript demo on this page to hear STT → reply → TTS.',
            'Configure Agent Runtime permissions in the console.',
            'Call POST /v1/voice/simulate or wire MCP/CLI for video voice.',
          ],
          links: [
            { label: 'Agents console', href: '/voice' },
            { label: 'Developers', href: '/developers' },
            { label: 'API docs', href: '/docs' },
          ],
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
        {
          id: 'guide-api',
          kind: 'api',
          title: 'Integration checklist',
          body: 'Authenticate, call /v1, meter usage, then wire MCP/CLI for video voice.',
          steps: [
            'Create an lg_live_ key in the console.',
            'Call translate, speech, or chat completions from docs or playground.',
            'Use @lugemi/sdk, MCP, CLI, or Android/iOS HTTP helpers for video voice.',
          ],
          links: [
            { label: 'API docs', href: '/docs' },
            { label: 'Playground', href: '/playground' },
            { label: 'Developers / SDKs', href: '/developers' },
            { label: 'API keys', href: '/keys' },
          ],
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
      body: 'Lugemi speaking agents and translation help trade desks operate across East Africa corridors, West African markets, and global partners without losing etiquette or clarity. Meaning travels with cultural context, not just word swaps.',
      sections: [
        {
          id: 'voice',
          title: 'Voice trade desks',
          body: 'Bilingual agents that greet, quote, and escalate in Kiswahili, English, Hausa, Yorùbá, and more — with measurable accents and reviewable transcripts.',
        },
        {
          id: 'docs',
          title: 'Documented deals',
          body: 'Translate contracts, invoices, and product sheets with glossary + human review so high-stakes wording stays accountable.',
        },
        {
          id: 'guide-trade',
          kind: 'guide',
          title: 'How trade teams ship',
          body: 'Pilot a speaking agent, then wire the same /v1 paths into your CRM or hotline.',
          steps: [
            'Try the agent transcript demo on this page.',
            'Open Agents console and simulate a bilingual quote turn.',
            'Call POST /v1/voice/simulate or Translate from your integration.',
          ],
          links: [
            { label: 'Agents', href: '/voice' },
            { label: 'Translate', href: '/translate' },
            { label: 'Developers', href: '/developers' },
          ],
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
      body: 'Lugemi helps educators ship tutors and classroom audio that respect orthography, tone marks, and regional phrasing — from Yorùbá STEM to Amharic civic literacy. Availability is published per language and task, never assumed.',
      sections: [
        {
          id: 'tutors',
          title: 'Speaking tutors',
          body: 'Agents that teach aloud with cultural context and mother-tongue first turns, then switch languages when learners ask.',
        },
        {
          id: 'content',
          title: 'Localized content',
          body: 'Studio localization for lessons, assessments, and parent communication — with review before distribution.',
        },
        {
          id: 'guide-edu',
          kind: 'guide',
          title: 'Education rollout',
          body: 'Start with one subject language pair, then expand coverage using the public matrix.',
          steps: [
            'Check language/task availability on Coverage.',
            'Demo translate + play for a lesson snippet.',
            'Integrate Speech + Translate APIs for classroom apps.',
          ],
          links: [
            { label: 'Coverage', href: '/coverage' },
            { label: 'Translate demo', href: '/p/lugemi-translate' },
            { label: 'API docs', href: '/docs' },
          ],
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
      body: 'Replace brittle IVR trees with Lugemi speaking agents that listen and reply in the languages your customers already use — with metering, RBAC workspaces, and review for production support desks.',
      sections: [
        {
          id: 'support',
          title: 'Support agents',
          body: 'Voice FAQ and escalation scripts tuned for African and global language communities, with audit-friendly usage logs.',
        },
        {
          id: 'ivr',
          title: 'Inbound voice',
          body: 'Hotline-ready STT → reason → TTS paths. Connect telephony providers via your stack; Lugemi owns the language layer.',
        },
        {
          id: 'guide-cx',
          kind: 'guide',
          title: 'CX pilot plan',
          body: 'Prove one queue in one language pair before scaling.',
          steps: [
            'Simulate a support turn in the Agents console.',
            'Invite teammates under org RBAC to share the workspace.',
            'Wire /v1 speech + chat completions into your contact center.',
          ],
          links: [
            { label: 'Agents', href: '/voice' },
            { label: 'Identity / invites', href: '/identity' },
            { label: 'Developers', href: '/developers' },
          ],
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
      body: 'Lugemi Studio gives creative teams region-aware voices, consent-gated clones, and localization chips — so campaigns sound native across African markets without flattening cultural nuance.',
      sections: [
        {
          id: 'ads',
          title: 'Ads & narration',
          body: 'Produce multilingual spots with own:* voices, then localize scripts with Translate before final mix.',
        },
        {
          id: 'characters',
          title: 'Character voices',
          body: 'Consistent personas with synthetic disclosure where listeners could assume a live person.',
        },
        {
          id: 'guide-creative',
          kind: 'guide',
          title: 'Creative production path',
          body: 'Draft → voice → localize → disclose.',
          steps: [
            'Play region voices in the demo above.',
            'Generate narration in the Voice console.',
            'Use Studio review + watermarked clones only with consent.',
          ],
          links: [
            { label: 'Voice', href: '/audio' },
            { label: 'Studio page', href: '/p/lugemi-studio' },
            { label: 'Policies', href: '/p/policies' },
          ],
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
      body: 'From the African Language Registry to first-party voice and the Lugemi platform, research feeds product paths. We publish evaluated availability per language and task — catalog membership is not a quality certificate.',
      sections: [
        {
          id: '2023',
          title: '2023 — African Language Registry',
          body: 'Seed languages, scripts, and task metadata so coverage claims stay evidence-grounded.',
        },
        {
          id: '2024',
          title: '2024 — Cultural intelligence',
          body: 'Dialect and accent metadata wired into speech and translation review paths.',
        },
        {
          id: '2025',
          title: '2025 — First-party voice',
          body: 'own:* voices and lg_live_ API keys as the intended production route.',
        },
        {
          id: 'now',
          title: 'Now — Lugemi platform',
          body: 'Studio, Agents, Chat Studio, and API on one foundation with published per-task availability.',
        },
        {
          id: 'guide-research',
          kind: 'guide',
          title: 'Read the evidence',
          body: 'Start with coverage, models, and docs — not marketing adjectives.',
          steps: [
            'Open the public coverage matrix for language × task status.',
            'Review Lugemi model families for voice, chat, and vertical packs.',
            'Compare OpenAPI routes against what your workload needs.',
          ],
          links: [
            { label: 'Coverage', href: '/coverage' },
            { label: 'Models', href: '/models' },
            { label: 'Docs', href: '/docs' },
          ],
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
      body: 'Lugemi does not display compliance badges without published evidence. What we ship: moderation on generative speech, workspace accountability, synthetic provenance, and consent for biometrics and clones.',
      sections: [
        {
          id: 'moderation',
          title: 'Moderation',
          body: 'Policy checks on generative speech paths so misuse surfaces before scale.',
        },
        {
          id: 'accountability',
          title: 'Accountability',
          body: 'Workspace keys, usage logs, RBAC invites, and review states for clones and translations.',
        },
        {
          id: 'provenance',
          title: 'Synthetic provenance',
          body: 'Watermark and disclosure paths for generative voice so listeners are not misled.',
        },
        {
          id: 'consent',
          title: 'Consent',
          body: 'Cloning and biometric enrollment require attestation — authorization is never assumed.',
        },
        {
          id: 'guide-safety',
          kind: 'guide',
          title: 'Safety controls tour',
          body: 'See the controls in the product, not only on this page.',
          steps: [
            'Review Policies for consent and disclosure expectations.',
            'Use Identity to invite teammates with least-privilege roles.',
            'Inspect Data settings for retention, residency, and vendor-training flags.',
          ],
          links: [
            { label: 'Policies', href: '/p/policies' },
            { label: 'Identity', href: '/identity' },
            { label: 'Data & branding', href: '/data' },
          ],
        },
      ],
      primaryCta: { label: 'Read policies', href: '/p/policies' },
      secondaryCta: { label: 'Talk to us', href: '/sign-up' },
      footerColumn: 'resources',
    }),
    page({
      slug: 'updates',
      title: 'Latest updates',
      eyebrow: 'Resources',
      lead: 'What is shipping on the Lugemi platform.',
      body: 'Product notes for coverage, first-party models, Chat Studio live translate, RBAC invites, and speaking agents. Owners can refine this page anytime from Admin → CMS.',
      sections: [
        {
          id: 'coverage',
          title: 'Public language coverage',
          body: 'Homepage and product CTAs point at real availability via the coverage matrix — not implied universality.',
        },
        {
          id: 'first-party',
          title: 'First-party positioning',
          body: 'Lugemi owns the API and model registry for voice, video, chat, and vertical language packs.',
        },
        {
          id: 'chat-studio',
          title: 'Chat Studio',
          body: 'Record for realtime phrase translation, upload documents/video/voice, and connect office plugins.',
        },
        {
          id: 'agents',
          title: 'Speaking agents',
          body: 'Developers ship agents that talk across languages, accents, and cultural contexts with MCP/CLI helpers.',
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
      body: 'People should not need to abandon their language to benefit from technology. Lugemi builds first-party language intelligence infrastructure — APIs, models, speech, translation, and speaking agents — with African languages, accents, and cultural contexts as the investment priority. Latin America, Southeast Asia, the Caribbean, and other global markets share the same coherent surface.',
      sections: [
        {
          id: 'mission',
          title: 'Mission',
          body: 'Build practical language intelligence tools that prioritize African languages and dialects while enabling organizations worldwide to work through speech and text with local context and clear controls.',
        },
        {
          id: 'values',
          title: 'How we behave',
          body: 'Inclusion before market defaults. Respect for orthography and names. Clarity about cost and limits. Reliability with recoverable failures. Agency over recordings and data. Partnership with language communities.',
        },
        {
          id: 'domain',
          title: 'Brand home',
          body: 'lugemi.com is the brand destination for Studio, Agents, API, and Chat Studio under Lugemi guidelines.',
        },
        {
          id: 'guide-about',
          kind: 'guide',
          title: 'Explore the platform',
          body: 'See capability before believing slogans.',
          steps: [
            'Skim product pages with live demos.',
            'Open Coverage and Models for honest availability.',
            'Sign up and try Translate (default English → Twi) or Chat Studio.',
          ],
          links: [
            { label: 'Coverage', href: '/coverage' },
            { label: 'Models', href: '/models' },
            { label: 'Chat Studio', href: '/chat' },
          ],
        },
      ],
      primaryCta: { label: 'Start free', href: '/sign-up' },
      secondaryCta: { label: 'Research', href: '/p/research' },
      footerColumn: 'company',
    }),
    page({
      slug: 'policies',
      title: 'Policies',
      eyebrow: 'Company',
      lead: 'How Lugemi handles consent, synthetic speech, and workspace data.',
      body: 'Voice cloning requires authorization. Generated speech should be identifiable where it could be mistaken for a live person. Workspace keys, RBAC, and usage logs support accountability. Legal counsel should review final terms before commercial filings — this page states product controls that already exist.',
      sections: [
        {
          id: 'consent',
          title: 'Consent for clones',
          body: 'Authorization is required before cloning a voice. Profiles can be reviewed, approved, rejected, or disabled by workspace owners and admins.',
        },
        {
          id: 'disclosure',
          title: 'Synthetic disclosure',
          body: 'Mark generative speech where listeners could reasonably assume a live person. Watermark requirements apply on clone speech paths.',
        },
        {
          id: 'coverage',
          title: 'Honest coverage',
          body: 'Availability is published per language and task. Catalog membership is not a quality certificate.',
        },
        {
          id: 'data',
          title: 'Data controls',
          body: 'Retention, residency pins, source-text persistence, and vendor-training flags live under Data settings. Email branding (logo, address, socials) is editable there for system mail.',
        },
      ],
      primaryCta: { label: 'Safety', href: '/p/safety' },
      secondaryCta: { label: 'Data settings', href: '/data' },
      footerColumn: 'company',
    }),
    page({
      slug: 'socials',
      title: 'Social channels',
      eyebrow: 'Company',
      lead: 'Follow Lugemi for product and coverage updates.',
      body: 'Primary destination is lugemi.com. Add X, LinkedIn, and GitHub URLs in Data → Email branding (used in system emails) and update these page links from Admin → CMS when channels go live.',
      sections: [
        {
          id: 'web',
          title: 'Website',
          body: 'https://lugemi.com — primary brand destination for Studio, Agents, and API.',
        },
        {
          id: 'updates',
          title: 'Product updates',
          body: 'Ship notes and coverage changes are listed on Latest updates until social channels launch.',
        },
        {
          id: 'branding',
          title: 'Email & footer socials',
          body: 'Owners configure address and social handles under Data → Email branding so every system email carries the Lugemi logo and footer.',
        },
        {
          id: 'guide-socials',
          kind: 'guide',
          title: 'Stay in the loop',
          body: 'Until public socials launch, use in-product surfaces.',
          steps: [
            'Read Latest updates for shipping notes.',
            'Join a workspace invite from Identity if your team shares Lugemi.',
            'Set branding social URLs so outbound email footers stay current.',
          ],
          links: [
            { label: 'Latest updates', href: '/p/updates' },
            { label: 'Data & branding', href: '/data' },
            { label: 'About', href: '/p/about' },
          ],
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
      text: 'Build AI agents that speak Twi, Kiswahili, and Yorùbá with cultural context.',
      source: 'en',
      target: 'ak',
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

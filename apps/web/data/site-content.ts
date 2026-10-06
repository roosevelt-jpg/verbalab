/**
 * Admin-editable site content defaults for Lugemi.
 * Structure is intentional: marketing, console, agents, and hub catalogs live here
 * so admins can later swap copy without hunting hardcoded strings across pages.
 */

export type ProductCard = {
  id: string;
  name: string;
  body: string;
  href: string;
  art: 'voice' | 'speech' | 'translate' | 'agents' | 'api' | 'coverage';
};

export type AgentTemplate = {
  id: string;
  name: string;
  language: string;
  accent: string;
  culturalContext: string;
  script: string;
  goal: string;
};

export type SampleVoice = {
  id: string;
  label: string;
  language: string;
  region: string;
  ethnicContext: string;
  voiceId: string;
};

export type HubCatalogItem = {
  id: string;
  title: string;
  body: string;
};

export type SiteContent = {
  brand: {
    name: string;
    domain: string;
    tagline: string;
    positioning: string;
  };
  hero: {
    eyebrow: string;
    brand: string;
    headline: string;
    lead: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  products: ProductCard[];
  samplePrompts: { id: string; label: string; text: string; language: string }[];
  sampleVoices: SampleVoice[];
  agentTemplates: AgentTemplate[];
  apiSnippets: {
    speech: string;
    translate: string;
    agentSimulate: string;
  };
  safety: { title: string; body: string }[];
  dashboardWelcome: {
    title: string;
    lead: string;
    starterCards: { title: string; body: string; href: string }[];
  };
  docsIntro: {
    title: string;
    lead: string;
  };
  playgroundDefaults: {
    text: string;
    source: string;
    target: string;
  };
  hubDefaults: {
    catalogTitle: string;
    catalogLead: string;
    items: HubCatalogItem[];
  };
  social: { label: string; href: string | null; note: string }[];
};

export const SITE_CONTENT: SiteContent = {
  brand: {
    name: 'Lugemi',
    domain: 'lugemi.com',
    tagline: 'Next-generation language intelligence for speaking agents.',
    positioning:
      'Developers build AI agents that speak and talk across languages and accents — with cultural understanding of countries, ethnic groups, and tribes. Africa-first completeness; LATAM, SEA, Middle East, and the EU in scope. Own API and own models.',
  },
  hero: {
    eyebrow: 'Speaking agents · Languages · Accents · Culture',
    brand: 'Lugemi',
    headline: 'Build agents that speak every language and accent.',
    lead:
      'The next-generation language intelligence platform for developers. Ship AI agents that talk with cultural context — countries, ethnic groups, and tribes — starting with complete African language coverage, then LATAM, Southeast Asia, the Middle East, and the EU. First-party API and models.',
    primaryCta: { label: 'Start building', href: '/sign-up' },
    secondaryCta: { label: 'Open console', href: '/dashboard' },
  },
  products: [
    {
      id: 'voice',
      name: 'Lugemi Voice',
      body: 'Text to speech and consent-gated cloning for resonant, region-aware voices — the sound layer for speaking agents.',
      href: '/audio',
      art: 'voice',
    },
    {
      id: 'speech',
      name: 'Lugemi Speech',
      body: 'Speech to text that understands accents, dialects, and code-switching across African and global language communities.',
      href: '/speech',
      art: 'speech',
    },
    {
      id: 'translate',
      name: 'Lugemi Translate',
      body: 'Move meaning across languages without flattening cultural nuance — registry-backed, reviewable, metered.',
      href: '/translate',
      art: 'translate',
    },
    {
      id: 'agents',
      name: 'Speaking agents',
      body: 'Voice FAQ and agent runtimes so developers can ship agents that listen, reason, and reply aloud in context.',
      href: '/voice',
      art: 'agents',
    },
    {
      id: 'api',
      name: 'Lugemi API',
      body: 'Own endpoints and @lugemi/sdk — speech, translate, detect, voice simulate. Not a vendor wrapper product.',
      href: '/docs',
      art: 'api',
    },
    {
      id: 'coverage',
      name: 'Language coverage',
      body: 'Published registry and evaluated pairs. Africa-first catalog of countries, languages, and ethnic varieties.',
      href: '/coverage',
      art: 'coverage',
    },
  ],
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
    speech: `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
});

const speech = await client.speech({
  text: 'Habari, dunia.',
  voice: 'own:sw-ke-female',
});`,
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
  safety: [
    {
      title: 'Consent for clones',
      body: 'Voice cloning is consent-gated. Authorization is required, not assumed.',
    },
    {
      title: 'Review & disable',
      body: 'Clone profiles can be reviewed, approved, rejected, or disabled from the console.',
    },
    {
      title: 'Synthetic disclosure',
      body: 'Generated speech should be identifiable where it could be mistaken for a live person.',
    },
    {
      title: 'Honest coverage',
      body: 'Availability is published per language and task. Catalog membership is not a quality certificate.',
    },
  ],
  dashboardWelcome: {
    title: 'Welcome to Lugemi',
    lead:
      'Build speaking agents across languages and accents with cultural context. Start from Voice Studio, Agent Runtime, or the API playground — Africa-first coverage is the investment priority.',
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
    lead:
      'First-party language intelligence: generate speech, transcribe, translate, and simulate voice agents. Africa-first languages, dialects, accents, and cultural context; LATAM, Southeast Asia, the Middle East, and the EU in scope. Authenticate with Bearer lg_live_… or soft-sandbox lg_test_….',
  },
  playgroundDefaults: {
    text: 'Build AI agents that speak Kiswahili, Yorùbá, and Amharic with cultural context.',
    source: 'en',
    target: 'sw',
  },
  hubDefaults: {
    catalogTitle: 'Platform catalog',
    catalogLead:
      'Prefill catalog for this console surface. Live engine payloads appear below when the API is reachable. Admins can later edit these defaults from site content.',
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
  social: [
    { label: 'X', href: null, note: 'Channel opens after brand launch' },
    { label: 'LinkedIn', href: null, note: 'Channel opens after brand launch' },
    { label: 'Docs', href: '/docs', note: 'API reference' },
    { label: 'Coverage', href: '/coverage', note: 'Language registry' },
  ],
};

/** Per-hub lede overrides keyed by route segment (e.g. trust-cloud). */
export const HUB_LEDES: Record<string, string> = {
  'agentops-platform':
    'Operate speaking-agent fleets: run health, turn quality, and permission audits for multilingual voice agents.',
  'agent-runtime':
    'Sandbox agents with hard permission allowlists — the runtime layer behind Lugemi speaking agents.',
  'agent-operating-system':
    'Unify agent lifecycle, memory, and voice I/O so developers ship talk-ready agents in every language.',
  'agent-marketplace':
    'Discover and license agent templates tuned for African languages, accents, and cultural contexts.',
  voice:
    'Voice FAQ agents that speak and listen — bilingual demo path with STT, FAQ model, and TTS.',
  'voice-studio':
    'Craft lexemes, presets, and region-aware voices for agents that sound native to their audience.',
  'neural-tts':
    'Neural TTS for own:* voices — Africa-first accents with cultural metadata on every render.',
  speech:
    'Speech Cloud hub: STT, TTS, interpreter, and voice studio for speaking-agent pipelines.',
  'trust-cloud':
    'Safety, privacy, and compliance controls for generative speech and speaking agents.',
  coverage:
    'Registry and evaluated pairs — Africa-first catalog with honest per-task availability.',
};

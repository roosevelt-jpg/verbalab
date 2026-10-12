/** Lugemi docs overview — capability and model catalog (mirrors OpenAPI surface). */

export type DocsEndpoint = {
  method: string;
  path: string;
  summary: string;
  description: string;
};

export type DocsCategory = {
  id: string;
  title: string;
  tagline: string;
  items: DocsEndpoint[];
};

export type DocsCapability = {
  id: string;
  title: string;
  body: string;
  href: string;
  apiPath?: string;
};

export type DocsModel = {
  id: string;
  name: string;
  family: string;
  blurb: string;
  points: string[];
  href: string;
};

export type DocsPath = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export const DOCS_PATHS: DocsPath[] = [
  {
    id: 'creative',
    title: 'Lugemi Creative',
    body: 'No-code studio for speech, dubbing, voice tools, and localization workflows in the browser.',
    href: '/creative',
    cta: 'Open Creative',
  },
  {
    id: 'agents',
    title: 'Lugemi Agents',
    body: 'Design and operate speaking agents with Accent Identity, Chat Studio, and live translate.',
    href: '/chat',
    cta: 'Open Chat Studio',
  },
  {
    id: 'api',
    title: 'Lugemi API',
    body: 'REST + OpenAPI for every capability, with @lugemi/sdk (TypeScript) and MCP for agent IDEs.',
    href: '/docs/api',
    cta: 'API reference',
  },
  {
    id: 'builders',
    title: 'Builders',
    body: 'Ship native accent catalogs, connectors, and production own:* voices under your product.',
    href: '/builders',
    cta: 'Open Builders',
  },
];

export const DOCS_MODELS: DocsModel[] = [
  {
    id: 'echo-voice',
    name: 'Lugemi Echo Voice',
    family: 'Text-to-speech',
    blurb: 'Neural own:* speech for African and global corridors — batch + stream.',
    points: [
      'own:* catalog + clone:{id} with consent',
      'Cultural English and L1 accents',
      'POST /v1/tts/synthesize · /v1/audio/speech',
      'Streaming via /v1/tts/stream',
    ],
    href: '/neural-tts',
  },
  {
    id: 'echo-listen',
    name: 'Lugemi Echo Listen',
    family: 'Speech-to-text',
    blurb: 'ASR for accents, dialects, and code-switching with word-level timestamps.',
    points: [
      'Multipart transcription',
      'Dialect-aware recognition',
      'POST /v1/audio/transcriptions',
      'Live sessions via /v1/live/*',
    ],
    href: '/speech-recognition',
  },
  {
    id: 'baobab',
    name: 'Lugemi Baobab',
    family: 'Translation',
    blurb: 'Africa-first dialect-aware MT with glossary, TM, formats, and SSE stream.',
    points: [
      '213-language registry',
      'Default en→Twi (ak) pairs',
      'POST /v1/translate · /stream · /formats',
      'Document jobs /v1/documents/translate',
    ],
    href: '/translate',
  },
  {
    id: 'atlas',
    name: 'Lugemi Atlas',
    family: 'Reasoning chat',
    blurb: 'Multilingual reasoning for dialect, culture, and vertical speaking-agent tasks.',
    points: [
      'Chat completions with optional translateReplyTo',
      'Serving residency (e.g. Accra · af-west-1)',
      'POST /v1/chat/completions',
      'MCP tool surface for IDEs',
    ],
    href: '/chat',
  },
  {
    id: 'vector',
    name: 'Lugemi Vector',
    family: 'Embeddings',
    blurb: 'Cross-lingual embeddings for RAG, retrieval, and knowledge grounding.',
    points: [
      'POST /v1/embeddings',
      'Knowledge query /v1/knowledge/query',
      'Dataset + vector cloud surfaces',
    ],
    href: '/knowledge',
  },
];

export const DOCS_CAPABILITIES: DocsCapability[] = [
  {
    id: 'tts',
    title: 'Text to speech',
    body: 'Convert text into lifelike Echo speech with own:* voices.',
    href: '/docs/api#post%20%2Fv1%2Ftts%2Fsynthesize',
    apiPath: '/v1/tts/synthesize',
  },
  {
    id: 'stt',
    title: 'Speech to text',
    body: 'Transcribe spoken audio with timestamps and dialect cues.',
    href: '/docs/api#post%20%2Fv1%2Faudio%2Ftranscriptions',
    apiPath: '/v1/audio/transcriptions',
  },
  {
    id: 'translate',
    title: 'Translate',
    body: 'Dialect-aware Baobab MT across the language registry.',
    href: '/docs/api#post%20%2Fv1%2Ftranslate',
    apiPath: '/v1/translate',
  },
  {
    id: 'detect',
    title: 'Language detect',
    body: 'Identify language, script, and confidence before MT.',
    href: '/docs/api#post%20%2Fv1%2Fdetect',
    apiPath: '/v1/detect',
  },
  {
    id: 'chat',
    title: 'Chat completions',
    body: 'Atlas reasoning with optional reply translation.',
    href: '/docs/api#post%20%2Fv1%2Fchat%2Fcompletions',
    apiPath: '/v1/chat/completions',
  },
  {
    id: 'voices',
    title: 'Voices & accents',
    body: 'Catalog, Accent Identity packs, and cultural speech varieties.',
    href: '/accent-identity',
    apiPath: '/v1/tts/voices',
  },
  {
    id: 'dialogue',
    title: 'Multi-speaker dialogue',
    body: 'Turn-based scenes with distinct Echo voices per speaker — podcasts, ads, NPCs.',
    href: '/creative/dialogue',
    apiPath: '/v1/dialogue/synthesize',
  },
  {
    id: 'align',
    title: 'Forced alignment',
    body: 'Word timings with SRT/VTT for captions, dubbing QA, and LearnBack.',
    href: '/creative/captions',
    apiPath: '/v1/align',
  },
  {
    id: 'voice-design',
    title: 'Voice Design',
    body: 'Prompt a creative brief; receive ranked live Echo voice matches.',
    href: '/creative/voice-design',
    apiPath: '/v1/voice-design',
  },
  {
    id: 'speech-embed',
    title: 'Speech Player embeds',
    body: 'Drop narrated players on articles, docs, and help centers.',
    href: '/creative/speech-embed',
    apiPath: '/v1/speech-embed',
  },
  {
    id: 'clones',
    title: 'Voice cloning',
    body: 'Consent-gated clones with watermarked synthesis.',
    href: '/voice-cloning',
    apiPath: '/v1/voice-clones',
  },
  {
    id: 'dubbing',
    title: 'Dubbing & interpret',
    body: 'STT → MT → TTS cascades for live and offline dubbing.',
    href: '/interpret',
    apiPath: '/v1/interpret',
  },
  {
    id: 'documents',
    title: 'Documents',
    body: 'Async PDF/DOCX translation jobs with layout awareness.',
    href: '/documents',
    apiPath: '/v1/documents/translate',
  },
  {
    id: 'localize',
    title: 'Localize',
    body: 'i18n JSON/YAML trees with ICU and glossary fidelity.',
    href: '/localize',
    apiPath: '/v1/localize',
  },
  {
    id: 'stream',
    title: 'Streaming',
    body: 'SSE translate and TTS streams for live captions and agents.',
    href: '/streaming-runtime',
    apiPath: '/v1/translate/stream',
  },
  {
    id: 'live',
    title: 'Live sessions',
    body: 'Realtime audio sessions with events and repair loops.',
    href: '/live',
    apiPath: '/v1/live/sessions',
  },
  {
    id: 'voice-studio',
    title: 'Voice Studio',
    body: 'Workspace generations, assemblies, and review takes.',
    href: '/voice-studio',
    apiPath: '/v1/voice-studio',
  },
  {
    id: 'audio-intel',
    title: 'Audio intelligence',
    body: 'Enhancement, isolation, emotion, and speaker analytics.',
    href: '/audio-intelligence',
    apiPath: '/v1/audio-intelligence',
  },
  {
    id: 'pronunciation',
    title: 'Pronunciation',
    body: 'Pronunciation intelligence and scoring for learning agents.',
    href: '/pronunciation-intelligence',
    apiPath: '/v1/pronunciation',
  },
  {
    id: 'biometrics',
    title: 'Voice biometrics',
    body: 'Speaker verification and identity-aware voice checks.',
    href: '/voice-biometrics',
    apiPath: '/v1/voice-biometrics',
  },
  {
    id: 'knowledge',
    title: 'Knowledge & RAG',
    body: 'Grounded queries with citations over workspace corpora.',
    href: '/knowledge',
    apiPath: '/v1/knowledge/query',
  },
  {
    id: 'embeddings',
    title: 'Embeddings',
    body: 'Cross-lingual vectors for retrieval and matching.',
    href: '/docs/api#post%20%2Fv1%2Fembeddings',
    apiPath: '/v1/embeddings',
  },
  {
    id: 'languages',
    title: 'Languages & coverage',
    body: 'Full registry, locales, African strategic set, coverage matrix.',
    href: '/coverage',
    apiPath: '/v1/languages',
  },
  {
    id: 'glossary',
    title: 'Glossary & TM',
    body: 'Terminology and translation memory applied on every turn.',
    href: '/docs/api',
    apiPath: '/v1/glossary/terms',
  },
  {
    id: 'language-passport',
    title: 'Language Passport',
    body: 'Private approved meaning memory synced to glossary, ASR, Accent Identity, and OWN TTS.',
    href: '/language-passport',
    apiPath: '/v1/passport/me',
  },
  {
    id: 'mcp',
    title: 'MCP',
    body: 'Model Context Protocol bridge for Cursor and agent IDEs.',
    href: '/docs/mcp',
    apiPath: '/v1/mcp',
  },
  {
    id: 'connectors',
    title: 'Connectors',
    body: 'Slack, office, storage, and platform connector catalog.',
    href: '/docs/connectors',
    apiPath: '/v1/connectors/platform',
  },
  {
    id: 'meetingbridge',
    title: 'MeetingBridge',
    body: 'Live meeting captions, sync, and bilingual facilitation.',
    href: '/meetingbridge',
  },
  {
    id: 'dealbridge',
    title: 'DealBridge',
    body: 'Negotiation and trade sessions with dialect-aware turns.',
    href: '/dealbridge',
  },
  {
    id: 'accessline',
    title: 'AccessLine',
    body: 'Telephony dialer and inbound voice access lines.',
    href: '/accessline',
  },
  {
    id: 'integrity',
    title: 'Integrity & provenance',
    body: 'Watermarks, consent attestations, and audit verification.',
    href: '/docs/api',
    apiPath: '/v1/language-integrity/verify',
  },
  {
    id: 'usage',
    title: 'Usage & billing',
    body: 'Character, token, and STT minute metering against plans.',
    href: '/billing',
    apiPath: '/v1/usage/summary',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    body: 'Listings, installs, and Connect onboarding for extensions.',
    href: '/marketplace',
    apiPath: '/v1/marketplace/listings',
  },
  {
    id: 'datasets',
    title: 'Datasets & training',
    body: 'Dataset versions, fine-tunes, and training job launchers.',
    href: '/datasets',
    apiPath: '/v1/datasets',
  },
  {
    id: 'ocr',
    title: 'OCR',
    body: 'Document and image text extraction into translate pipelines.',
    href: '/ocr',
  },
];

export const DOCS_CATEGORIES: DocsCategory[] = [
  {
    id: 'speech-audio',
    title: 'Voice & speech',
    tagline: 'Echo Voice TTS, Echo Listen ASR, accents, clones, and live audio.',
    items: [
      {
        method: 'POST',
        path: '/v1/tts/synthesize',
        summary: 'Neural text-to-speech',
        description:
          'Synthesize with own:* Echo voices or clone:{id}. Preferred Studio path when authenticated.',
      },
      {
        method: 'POST',
        path: '/v1/tts/stream',
        summary: 'Streaming TTS',
        description: 'Chunk SSE speech stream for agents and live playback loops.',
      },
      {
        method: 'GET',
        path: '/v1/tts/voices',
        summary: 'Voice catalog',
        description: 'List Echo voices with locale, gender, verification, and synth engine metadata.',
      },
      {
        method: 'POST',
        path: '/v1/audio/speech',
        summary: 'Legacy speech synthesize',
        description: 'Compatible speech endpoint used by SDKs and audio console (same Echo gateway).',
      },
      {
        method: 'POST',
        path: '/v1/audio/transcriptions',
        summary: 'Speech-to-text',
        description: 'Multipart transcription with timestamps, dialect cues, and metered minutes.',
      },
      {
        method: 'GET',
        path: '/v1/accents/identity',
        summary: 'Accent Identity packs',
        description: 'Country-complete cultural identity packs with sample phrases and Echo voice links.',
      },
      {
        method: 'GET / POST',
        path: '/v1/voice-clones',
        summary: 'Voice clone management',
        description: 'Consent-gated clones with watermark headers on synthesis.',
      },
      {
        method: 'POST',
        path: '/v1/interpret',
        summary: 'Live interpreter cascade',
        description: 'Audio → STT → Baobab MT → Echo TTS for realtime interpretation.',
      },
      {
        method: 'POST',
        path: '/v1/voice/simulate',
        summary: 'Voice FAQ simulator',
        description: 'Multi-turn speaking-agent simulation with sentiment and confidence.',
      },
      {
        method: 'POST',
        path: '/v1/demo/speech',
        summary: 'Public Play speech',
        description: 'Rate-limited public sample path; remaps formant-only packs to cultural English/French.',
      },
    ],
  },
  {
    id: 'translation',
    title: 'Translation & localization',
    tagline: 'Baobab MT, documents, formats, glossary, and SSE streams.',
    items: [
      {
        method: 'POST',
        path: '/v1/translate',
        summary: 'Dialect-aware translation',
        description: 'Africa-first pairs (default en→ak) with glossary/TM and honest local packs.',
      },
      {
        method: 'POST',
        path: '/v1/translate/stream',
        summary: 'SSE translate stream',
        description: 'Segment streaming for live captions and agent loops.',
      },
      {
        method: 'POST',
        path: '/v1/translate/formats',
        summary: 'Structured formats',
        description: 'Translate HTML, Markdown, SRT/VTT, and structured payloads.',
      },
      {
        method: 'POST',
        path: '/v1/translate/chat',
        summary: 'Chat-oriented translate',
        description: 'Turn-aware translation helpers for conversational agents.',
      },
      {
        method: 'GET',
        path: '/v1/translate/engine',
        summary: 'Translate engine catalog',
        description: 'Baobab engine capabilities, residency, and feature matrix.',
      },
      {
        method: 'POST',
        path: '/v1/detect',
        summary: 'Language detection',
        description: 'Source language/script confidence with offline fallback.',
      },
      {
        method: 'POST',
        path: '/v1/localize',
        summary: 'i18n tree localization',
        description: 'Nested JSON/YAML with ICU placeholders preserved.',
      },
      {
        method: 'POST',
        path: '/v1/documents/translate',
        summary: 'Document translation',
        description: 'Async DOCX/PDF jobs with layout-aware processing.',
      },
      {
        method: 'GET / POST',
        path: '/v1/glossary/terms',
        summary: 'Terminology glossaries',
        description: 'Workspace brand lexicons applied deterministically in MT.',
      },
      {
        method: 'POST',
        path: '/v1/pragmatics/translate',
        summary: 'Pragmatic translation',
        description: 'Tone and speech-act aware localization for CX and sales.',
      },
    ],
  },
  {
    id: 'language-intelligence',
    title: 'Intelligence & models',
    tagline: 'Atlas chat, RAG, embeddings, model matrix, and MCP.',
    items: [
      {
        method: 'POST',
        path: '/v1/chat/completions',
        summary: 'Atlas chat completions',
        description: 'Regional reasoning with optional translateReplyTo for speaking agents.',
      },
      {
        method: 'POST',
        path: '/v1/knowledge/query',
        summary: 'Knowledge RAG query',
        description: 'Grounded answers with citations over workspace corpora.',
      },
      {
        method: 'POST',
        path: '/v1/embeddings',
        summary: 'Vector embeddings',
        description: 'Cross-lingual semantic vectors for retrieval.',
      },
      {
        method: 'GET',
        path: '/v1/models/live',
        summary: 'Live model matrix',
        description: 'Baobab, Echo, Atlas availability with residency and servingFrom.',
      },
      {
        method: 'GET',
        path: '/v1/models',
        summary: 'Model registry',
        description: 'Full model catalog with slugs, kinds, and configuration status.',
      },
      {
        method: 'POST',
        path: '/v1/mcp',
        summary: 'Model Context Protocol',
        description: 'JSON-RPC MCP endpoint for Cursor and agent IDEs.',
      },
      {
        method: 'GET',
        path: '/v1/languages',
        summary: 'Language registry',
        description: 'Complete language list with count/total/languageCount and African strategic set.',
      },
      {
        method: 'GET',
        path: '/v1/coverage',
        summary: 'Coverage matrix',
        description: 'Published speech/translate coverage by language and corridor.',
      },
      {
        method: 'GET',
        path: '/v1/locales',
        summary: 'Locale catalog',
        description: 'BCP-47 locales with examples and engine metadata.',
      },
      {
        method: 'GET',
        path: '/v1/registry',
        summary: 'Script & family registry',
        description: 'Families, scripts, alphabets, and validation rules.',
      },
    ],
  },
  {
    id: 'realtime-agents',
    title: 'Realtime & agents',
    tagline: 'Live sessions, streaming runtime, MeetingBridge, DealBridge, AccessLine.',
    items: [
      {
        method: 'POST',
        path: '/v1/live/sessions',
        summary: 'Live audio sessions',
        description: 'Create realtime sessions with event streams and repair.',
      },
      {
        method: 'POST',
        path: '/v1/mix/transcribe-translate',
        summary: 'Transcribe + translate mix',
        description: 'Combined STT and Baobab MT for mixed media pipelines.',
      },
      {
        method: 'GET',
        path: '/v1/streaming-runtime',
        summary: 'Streaming runtime',
        description: 'Engine catalog for low-latency caption and agent loops.',
      },
      {
        method: 'GET',
        path: '/v1/connectors/platform',
        summary: 'Platform connectors',
        description: 'Voice, office, storage, and chat connector catalog with demo hooks.',
      },
      {
        method: 'POST',
        path: '/v1/grounded/interpret',
        summary: 'Grounded interpret',
        description: 'Interpretation with knowledge grounding for enterprise agents.',
      },
      {
        method: 'GET',
        path: '/v1/language-kits',
        summary: 'Language kits',
        description: 'Packaged corridor kits for speaking-agent deployments.',
      },
      {
        method: 'GET',
        path: '/v1/edge/packs',
        summary: 'Edge packs',
        description: 'Offline/edge language packs with verify and run endpoints.',
      },
      {
        method: 'GET',
        path: '/v1/agent-fabric',
        summary: 'Agent fabric',
        description: 'Agent operating surfaces for multi-turn speaking systems.',
      },
    ],
  },
  {
    id: 'studio-media',
    title: 'Studio & media intelligence',
    tagline: 'Voice Studio, audio intelligence, pronunciation, biometrics, OCR.',
    items: [
      {
        method: 'GET / POST',
        path: '/v1/voice-studio',
        summary: 'Voice Studio workspace',
        description: 'Generations, assemblies, and review workflows for production voice.',
      },
      {
        method: 'POST',
        path: '/v1/dialogue/synthesize',
        summary: 'Multi-speaker dialogue',
        description: 'Concatenate per-turn Echo synthesis into a dialogue WAV mix.',
      },
      {
        method: 'POST',
        path: '/v1/align',
        summary: 'Forced alignment',
        description: 'Phoneme-weighted word timings with SRT and VTT exports.',
      },
      {
        method: 'POST',
        path: '/v1/voice-design',
        summary: 'Voice Design from prompt',
        description: 'Rank live Echo voices against a creative brief.',
      },
      {
        method: 'POST / GET',
        path: '/v1/speech-embed',
        summary: 'Speech Player embeds',
        description: 'Create site players and public narration projects.',
      },
      {
        method: 'GET',
        path: '/v1/audio-intelligence',
        summary: 'Audio intelligence',
        description: 'Enhancement, isolation, emotion, and speaker analytics APIs.',
      },
      {
        method: 'GET',
        path: '/v1/pronunciation',
        summary: 'Pronunciation intelligence',
        description: 'Scoring and feedback for learning and speaking agents.',
      },
      {
        method: 'GET',
        path: '/v1/voice-biometrics',
        summary: 'Voice biometrics',
        description: 'Speaker verification and identity checks.',
      },
      {
        method: 'POST',
        path: '/v1/ocr',
        summary: 'OCR extract',
        description: 'Image/document text extraction into localization pipelines.',
      },
      {
        method: 'POST',
        path: '/v1/fidelity/verify',
        summary: 'Fidelity verify',
        description: 'Meaning-preserving checks and clarification loops.',
      },
    ],
  },
  {
    id: 'integrity-governance',
    title: 'Integrity, usage & enterprise',
    tagline: 'Provenance, audit, billing, orgs, keys, and marketplace.',
    items: [
      {
        method: 'POST',
        path: '/v1/language-integrity/verify',
        summary: 'Provenance verification',
        description: 'Cryptographic watermarks and consent attestations.',
      },
      {
        method: 'GET',
        path: '/v1/language-integrity/protocol',
        summary: 'Adoption protocol',
        description: 'Formal bilingual filing and synthetic audio compliance protocol.',
      },
      {
        method: 'GET',
        path: '/v1/audit-events',
        summary: 'Audit log',
        description: 'Workspace audit trail for keys, clones, and exports.',
      },
      {
        method: 'GET',
        path: '/v1/usage/summary',
        summary: 'Usage & quotas',
        description: 'Character, token, and STT minute metering vs plan limits.',
      },
      {
        method: 'GET / POST',
        path: '/v1/api-keys',
        summary: 'API keys',
        description: 'Create live (lg_live_) and test (lg_test_) machine keys.',
      },
      {
        method: 'GET',
        path: '/v1/billing/summary',
        summary: 'Billing summary',
        description: 'Plan entitlements, checkout, and customer portal hooks.',
      },
      {
        method: 'GET',
        path: '/v1/organization/members',
        summary: 'Organization members',
        description: 'Membership, invites, and workspace roles.',
      },
      {
        method: 'GET',
        path: '/v1/marketplace/listings',
        summary: 'Marketplace',
        description: 'Listings, installs, sales, and Stripe Connect onboarding.',
      },
      {
        method: 'GET',
        path: '/v1/datasets',
        summary: 'Datasets',
        description: 'Dataset versions, licenses, and training content.',
      },
      {
        method: 'GET / POST',
        path: '/v1/finetunes/jobs',
        summary: 'Fine-tune jobs',
        description: 'Launch and complete fine-tune jobs for corridor models.',
      },
      {
        method: 'GET',
        path: '/v1/analytics/overview',
        summary: 'Analytics overview',
        description: 'Workspace request and product analytics.',
      },
      {
        method: 'GET',
        path: '/v1/feature-flags',
        summary: 'Feature flags',
        description: 'Entitlement and rollout flags for console surfaces.',
      },
    ],
  },
];

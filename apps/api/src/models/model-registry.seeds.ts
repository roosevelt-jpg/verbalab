import { echoVoiceIdentityVariantSeeds } from './echo-voice-identity-variants.seeds';

/** Gateway features tracked in the model registry (+ Language Intelligence). */
export const MODEL_FEATURES = [
  'translate',
  'stt',
  'tts',
  'ocr',
  'detect',
  'chat',
  'embeddings',
  'video',
  'security',
  'law',
  'government',
  'insurance',
  'compliance',
] as const;

export type ModelFeature = (typeof MODEL_FEATURES)[number];

export type ModelKind = 'vendor' | 'finetune' | 'http' | 'lugemi';

export type VendorDefaultSeed = {
  slug: string;
  feature: ModelFeature;
  provider: string;
  displayName: string;
  baseModel: string;
  notes: string;
  envKey: string | null;
  role?: 'primary' | 'fallback';
  kind?: ModelKind;
  hostedResidency?: string;
  dataCenter?: string;
  hostedRegion?: string;
};

/**
 * Lugemi proprietary Language Intelligence model families (default path).
 * Optional legacy adapters stay unbranded in product UI and act only as silent fallbacks.
 */
export const VENDOR_MODEL_SEEDS: VendorDefaultSeed[] = [
  {
    slug: 'lugemi-baobab-translate',
    feature: 'translate',
    provider: 'lugemi',
    displayName: 'Lugemi Baobab',
    baseModel: 'lugemi-baobab-mt-v1',
    notes:
      'Proprietary Africa-first MT for complex multilingual and dialect-aware translation. Long-context pairs, glossary/TM/quality. Default panel: English → Twi (ak-GH). Optional LUGEMI_MT_URL for remote Lugemi weights.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-translate-google',
    feature: 'translate',
    provider: 'legacy_mt',
    displayName: 'Legacy MT adapter',
    baseModel: 'legacy-mt-v2',
    notes: 'Silent optional fallback when keyed. Not branded in product UI.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-echo-listen',
    feature: 'stt',
    provider: 'lugemi',
    displayName: 'Lugemi Echo Listen',
    baseModel: 'lugemi-echo-asr-v1',
    notes:
      'Proprietary ASR for African accents and dialects. Complex multilingual transcription with optional LUGEMI_ASR_URL.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-stt-openai-whisper',
    feature: 'stt',
    provider: 'legacy_stt',
    displayName: 'Legacy STT adapter',
    baseModel: 'legacy-asr-v1',
    notes: 'Silent optional fallback when keyed. Not branded in product UI.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-echo-voice',
    feature: 'tts',
    provider: 'own_tts',
    displayName: 'Lugemi Echo Voice',
    baseModel: 'lugemi-echo-tts-v1',
    notes:
      'Proprietary neural voice family (own:*). Africa-first accents for complex speaking-agent and dubbing tasks. OWN_TTS_URL optional for remote Lugemi speech.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-tts-openai',
    feature: 'tts',
    provider: 'legacy_tts',
    displayName: 'Legacy stock TTS adapter',
    baseModel: 'legacy-tts-v1',
    notes: 'Silent optional fallback for stock voice ids when keyed. Not branded in product UI.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-tts-clone',
    feature: 'tts',
    provider: 'vendor_clone',
    displayName: 'Legacy voice cloning adapter',
    baseModel: 'multilingual_v2',
    notes: 'Optional cloned voices. Consent + abuse review required; watermark always on.',
    envKey: 'VENDOR_VOICE_CLONE_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-vision-docs',
    feature: 'ocr',
    provider: 'lugemi',
    displayName: 'Lugemi Vision',
    baseModel: 'lugemi-vision-ocr-v1',
    notes:
      'Document understanding for multilingual forms and notices. Optional LUGEMI_OCR_URL; legacy vision key remains a silent fallback.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-ocr-google-vision',
    feature: 'ocr',
    provider: 'legacy_ocr',
    displayName: 'Legacy OCR adapter',
    baseModel: 'legacy-ocr-v1',
    notes: 'Silent optional fallback when keyed. Not branded in product UI.',
    envKey: 'GOOGLE_VISION_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-lid',
    feature: 'detect',
    provider: 'lugemi',
    displayName: 'Lugemi Lid',
    baseModel: 'lugemi-lid-v1',
    notes:
      'Africa-aware language identification for complex multilingual routing. Local first-party path always available.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-detect-google',
    feature: 'detect',
    provider: 'legacy_detect',
    displayName: 'Legacy detect adapter',
    baseModel: 'legacy-detect-v1',
    notes: 'Silent optional fallback when keyed. Not branded in product UI.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-detect-franc',
    feature: 'detect',
    provider: 'franc',
    displayName: 'Lugemi Lid (offline core)',
    baseModel: 'lugemi-lid-offline',
    notes: 'Always-on local detect core used by Lugemi Lid.',
    envKey: null,
    role: 'fallback',
  },
  {
    slug: 'lugemi-atlas-reason',
    feature: 'chat',
    provider: 'lugemi',
    displayName: 'Lugemi Atlas',
    baseModel: 'lugemi-atlas-reason-v1',
    notes:
      'Proprietary multilingual reasoning LLM for complex tasks: long-context, dialect nuance, law/gov/compliance/insurance/security verticals. Optional LUGEMI_CHAT_URL for remote Lugemi weights.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-chat-openai',
    feature: 'chat',
    provider: 'legacy_chat',
    displayName: 'Legacy chat adapter',
    baseModel: 'legacy-chat-v1',
    notes: 'Silent optional fallback when keyed. Not branded in product UI.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-chat-openrouter',
    feature: 'chat',
    provider: 'legacy_chat_alt',
    displayName: 'Legacy chat fallback adapter',
    baseModel: 'legacy-chat-alt-v1',
    notes: 'Silent optional fallback when keyed. Not branded in product UI.',
    envKey: 'OPENROUTER_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-vector-embed',
    feature: 'embeddings',
    provider: 'lugemi',
    displayName: 'Lugemi Vector',
    baseModel: 'lugemi-vector-embed-v1',
    notes:
      'Multilingual retrieval embeddings for African language intelligence. Optional LUGEMI_EMBED_URL.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-embeddings-openai',
    feature: 'embeddings',
    provider: 'legacy_embed',
    displayName: 'Legacy embeddings adapter',
    baseModel: 'legacy-embed-v1',
    notes: 'Silent optional fallback when keyed. Not branded in product UI.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-fusion-video',
    feature: 'video',
    provider: 'lugemi',
    displayName: 'Lugemi Fusion Video',
    baseModel: 'lugemi-fusion-video-v1',
    notes:
      'Voice generation for complex video/dubbing pipelines via MCP/CLI/SDK — Echo-backed, Africa-first accents.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-sentinel',
    feature: 'security',
    provider: 'lugemi',
    displayName: 'Lugemi Sentinel',
    baseModel: 'lugemi-sentinel-v1',
    notes:
      'Threat and policy language understanding across African locales — complex multilingual security workflows.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-lex',
    feature: 'law',
    provider: 'lugemi',
    displayName: 'Lugemi Lex',
    baseModel: 'lugemi-lex-v1',
    notes:
      'Legal language intelligence for counsel and courts — jurisdiction-aware glossaries and complex bilingual filings. Not a law firm OS.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-civic',
    feature: 'government',
    provider: 'lugemi',
    displayName: 'Lugemi Civic',
    baseModel: 'lugemi-civic-v1',
    notes:
      'Public-sector language packs for citizen services, forms, and bilingual notices — dialect-aware and audit-friendly.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-cover',
    feature: 'insurance',
    provider: 'lugemi',
    displayName: 'Lugemi Cover',
    baseModel: 'lugemi-cover-v1',
    notes:
      'Claims, policy, and customer-care language for insurers across African markets — complex multilingual case work.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-accord',
    feature: 'compliance',
    provider: 'lugemi',
    displayName: 'Lugemi Accord',
    baseModel: 'lugemi-accord-v1',
    notes:
      'Regulatory and compliance language intelligence (KYC, AML wording, disclosure localization) for complex audit trails.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  ...echoVoiceIdentityVariantSeeds(),
];

export const MODEL_SLUG_ALIASES: Record<string, string> = {
  'lugemi-translate-africa': 'lugemi-baobab-translate',
  'lugemi-stt-africa': 'lugemi-echo-listen',
  'lugemi-tts-africa': 'lugemi-echo-voice',
  'lugemi-ocr-docs': 'lugemi-vision-docs',
  'lugemi-detect': 'lugemi-lid',
  'lugemi-chat-intelligence': 'lugemi-atlas-reason',
  'lugemi-embeddings': 'lugemi-vector-embed',
  'lugemi-video-voice': 'lugemi-fusion-video',
  'lugemi-security-language': 'lugemi-sentinel',
  'lugemi-law': 'lugemi-lex',
  'lugemi-government': 'lugemi-civic',
  'lugemi-insurance': 'lugemi-cover',
  'lugemi-compliance': 'lugemi-accord',
};

export function envConfigured(envKey: string | null): boolean {
  if (!envKey) return true;
  if (envKey === 'GOOGLE_VISION_API_KEY') {
    return Boolean(
      process.env.LUGEMI_OCR_URL?.trim() ||
        process.env.GOOGLE_VISION_API_KEY ||
        process.env.GOOGLE_TRANSLATE_API_KEY,
    );
  }
  if (envKey === 'GOOGLE_TRANSLATE_API_KEY') {
    return Boolean(process.env.LUGEMI_MT_URL?.trim() || process.env.GOOGLE_TRANSLATE_API_KEY?.trim());
  }
  if (envKey === 'OPENAI_API_KEY') {
    return Boolean(
      process.env.LUGEMI_CHAT_URL?.trim() ||
        process.env.LUGEMI_ASR_URL?.trim() ||
        process.env.LUGEMI_EMBED_URL?.trim() ||
        process.env.OPENAI_API_KEY?.trim() ||
        process.env.OPENROUTER_API_KEY?.trim(),
    );
  }
  if (envKey === 'OWN_TTS_URL') {
    return true;
  }
  return Boolean(process.env[envKey]);
}

export function isModelFeature(value: string): value is ModelFeature {
  return (MODEL_FEATURES as readonly string[]).includes(value);
}

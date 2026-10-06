/** Gateway features tracked in the model registry (VL-110 + Language Intelligence). */
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
  /** Env var that must be set for this provider to be callable (empty = always available). */
  envKey: string | null;
  /** Secondary ready entry (e.g. detect fallback). */
  role?: 'primary' | 'fallback';
  kind?: ModelKind;
};

/**
 * Default bought providers + Lugemi first-party Language Intelligence models.
 * Optional externalUrl (W&B, vendor docs) is set later by platform admins.
 */
export const VENDOR_MODEL_SEEDS: VendorDefaultSeed[] = [
  {
    slug: 'lugemi-translate-africa',
    feature: 'translate',
    provider: 'lugemi',
    displayName: 'Lugemi Translate (Africa-first)',
    baseModel: 'lugemi-mt-africa-v1',
    notes:
      'First-party Language Intelligence MT product. Runtime uses the AI Gateway (fine-tunes + Google fallback) until LUGEMI_MT_URL is set. Default panel pair: English → Twi (ak-GH).',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-translate-google',
    feature: 'translate',
    provider: 'google_translate',
    displayName: 'Google Cloud Translation',
    baseModel: 'cloud-translation-v2',
    notes: 'Legacy adapter (ADR-0002). Fine-tunes and Lugemi primary may override per pair.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-stt-africa',
    feature: 'stt',
    provider: 'lugemi',
    displayName: 'Lugemi Speech Recognition',
    baseModel: 'lugemi-asr-africa-v1',
    notes: 'First-party ASR product surface. Runtime uses Whisper adapter until LUGEMI_ASR_URL is set.',
    envKey: 'OPENAI_API_KEY',
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-stt-openai-whisper',
    feature: 'stt',
    provider: 'openai_whisper',
    displayName: 'OpenAI Whisper',
    baseModel: 'whisper-1',
    notes: 'Legacy STT adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-tts-africa',
    feature: 'tts',
    provider: 'own_tts',
    displayName: 'Lugemi Voice (own:*)',
    baseModel: 'lugemi-tts-africa-v1',
    notes:
      'Production African voice catalog via OWN_TTS_URL (own:* voices). Lugemi’s speech model — not ElevenLabs OS.',
    envKey: 'OWN_TTS_URL',
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-tts-openai',
    feature: 'tts',
    provider: 'openai_tts',
    displayName: 'OpenAI TTS',
    baseModel: 'tts-1',
    notes: 'Legacy stock-voice adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-tts-elevenlabs-clone',
    feature: 'tts',
    provider: 'elevenlabs',
    displayName: 'ElevenLabs voice cloning',
    baseModel: 'eleven_multilingual_v2',
    notes: 'Optional cloned voices (VL-064). Consent + abuse review required; watermark always on.',
    envKey: 'ELEVENLABS_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-ocr-docs',
    feature: 'ocr',
    provider: 'lugemi',
    displayName: 'Lugemi Document OCR',
    baseModel: 'lugemi-ocr-v1',
    notes: 'First-party OCR product surface. Runtime uses Vision adapter until LUGEMI_OCR_URL is set.',
    envKey: 'GOOGLE_VISION_API_KEY',
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-ocr-google-vision',
    feature: 'ocr',
    provider: 'google_vision',
    displayName: 'Google Cloud Vision OCR',
    baseModel: 'vision-ocr',
    notes: 'Uses GOOGLE_VISION_API_KEY or falls back to GOOGLE_TRANSLATE_API_KEY.',
    envKey: 'GOOGLE_VISION_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-detect',
    feature: 'detect',
    provider: 'lugemi',
    displayName: 'Lugemi Language Detect',
    baseModel: 'lugemi-lid-v1',
    notes:
      'Africa-aware language identification product. Runtime uses Google detect + franc offline fallback.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-detect-google',
    feature: 'detect',
    provider: 'google_detect',
    displayName: 'Google language detection',
    baseModel: 'cloud-translation-detect',
    notes: 'Legacy detect when Google key is set.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-detect-franc',
    feature: 'detect',
    provider: 'franc',
    displayName: 'franc (offline fallback)',
    baseModel: 'franc',
    notes: 'Always available offline fallback for detect.',
    envKey: null,
    role: 'fallback',
  },
  {
    slug: 'lugemi-chat-intelligence',
    feature: 'chat',
    provider: 'lugemi',
    displayName: 'Lugemi Chat Intelligence',
    baseModel: 'lugemi-chat-africa-v1',
    notes:
      'First-party chat for African language intelligence. Runtime uses OpenAI/OpenRouter until LUGEMI_CHAT_URL is set.',
    envKey: 'OPENAI_API_KEY',
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-chat-openai',
    feature: 'chat',
    provider: 'openai_chat',
    displayName: 'OpenAI Chat Completions',
    baseModel: 'gpt-4o-mini',
    notes: 'Legacy chat adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-chat-openrouter',
    feature: 'chat',
    provider: 'openrouter_chat',
    displayName: 'OpenRouter (OpenAI-compatible fallback)',
    baseModel: 'openai/gpt-4o-mini',
    notes: 'VL-129 optional chat fallback when OPENROUTER_API_KEY is set.',
    envKey: 'OPENROUTER_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-embeddings',
    feature: 'embeddings',
    provider: 'lugemi',
    displayName: 'Lugemi Multilingual Embeddings',
    baseModel: 'lugemi-embed-africa-v1',
    notes: 'Retrieval embeddings product. Runtime uses OpenAI embeddings until LUGEMI_EMBED_URL is set.',
    envKey: 'OPENAI_API_KEY',
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'vendor-embeddings-openai',
    feature: 'embeddings',
    provider: 'openai_embeddings',
    displayName: 'OpenAI Embeddings',
    baseModel: 'text-embedding-3-small',
    notes: 'Legacy embedding adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'lugemi-video-voice',
    feature: 'video',
    provider: 'lugemi',
    displayName: 'Lugemi Video Voice',
    baseModel: 'lugemi-video-voice-v1',
    notes: 'Voice generation for video pipelines via MCP/CLI/SDK — dubbing and content production.',
    envKey: 'OWN_TTS_URL',
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-security-language',
    feature: 'security',
    provider: 'lugemi',
    displayName: 'Lugemi Security Language',
    baseModel: 'lugemi-security-v1',
    notes: 'Threat / policy language understanding for security teams operating across African locales.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-law',
    feature: 'law',
    provider: 'lugemi',
    displayName: 'Lugemi Law',
    baseModel: 'lugemi-law-v1',
    notes: 'Legal language intelligence for counsel and courts — jurisdiction-aware glossaries, not a law firm OS.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-government',
    feature: 'government',
    provider: 'lugemi',
    displayName: 'Lugemi Government',
    baseModel: 'lugemi-gov-v1',
    notes: 'Public-sector language packs for citizen services, forms, and bilingual notices.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-insurance',
    feature: 'insurance',
    provider: 'lugemi',
    displayName: 'Lugemi Insurance',
    baseModel: 'lugemi-insurance-v1',
    notes: 'Claims, policy, and customer-care language for insurers across African markets.',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
  {
    slug: 'lugemi-compliance',
    feature: 'compliance',
    provider: 'lugemi',
    displayName: 'Lugemi Compliance',
    baseModel: 'lugemi-compliance-v1',
    notes: 'Regulatory and compliance language intelligence (KYC, AML wording, disclosure localization).',
    envKey: null,
    role: 'primary',
    kind: 'lugemi',
  },
];

export function envConfigured(envKey: string | null): boolean {
  if (!envKey) return true;
  if (envKey === 'GOOGLE_VISION_API_KEY') {
    return Boolean(process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY);
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
  return Boolean(process.env[envKey]);
}

export function isModelFeature(value: string): value is ModelFeature {
  return (MODEL_FEATURES as readonly string[]).includes(value);
}

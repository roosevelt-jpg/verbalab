/** Gateway features tracked in the model registry (VL-110). */
export const MODEL_FEATURES = [
  'translate',
  'stt',
  'tts',
  'ocr',
  'detect',
  'chat',
  'embeddings',
] as const;

export type ModelFeature = (typeof MODEL_FEATURES)[number];

export type ModelKind = 'vendor' | 'finetune' | 'http';

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
};

/**
 * Default bought providers — not trained weights.
 * Optional externalUrl (W&B, vendor docs) is set later by platform admins.
 */
export const VENDOR_MODEL_SEEDS: VendorDefaultSeed[] = [
  {
    slug: 'vendor-translate-google',
    feature: 'translate',
    provider: 'google_translate',
    displayName: 'Google Cloud Translation',
    baseModel: 'cloud-translation-v2',
    notes: 'Default MT adapter (ADR-0002). Fine-tunes may override per pair.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'primary',
  },
  {
    slug: 'vendor-stt-openai-whisper',
    feature: 'stt',
    provider: 'openai_whisper',
    displayName: 'OpenAI Whisper',
    baseModel: 'whisper-1',
    notes: 'Default STT adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'primary',
  },
  {
    slug: 'vendor-tts-openai',
    feature: 'tts',
    provider: 'openai_tts',
    displayName: 'OpenAI TTS',
    baseModel: 'tts-1',
    notes: 'Default TTS adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'primary',
  },
  {
    slug: 'own-tts-rented',
    feature: 'tts',
    provider: 'own_tts',
    displayName: 'Own TTS (rented / open-weight)',
    baseModel: 'xtts-or-compatible',
    notes:
      'VL-121: African voice catalog (own:*) via OWN_TTS_URL HTTP endpoint. OpenAI remains default for stock voices.',
    envKey: 'OWN_TTS_URL',
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
    slug: 'vendor-ocr-google-vision',
    feature: 'ocr',
    provider: 'google_vision',
    displayName: 'Google Cloud Vision OCR',
    baseModel: 'vision-ocr',
    notes: 'Uses GOOGLE_VISION_API_KEY or falls back to GOOGLE_TRANSLATE_API_KEY.',
    envKey: 'GOOGLE_VISION_API_KEY',
    role: 'primary',
  },
  {
    slug: 'vendor-detect-google',
    feature: 'detect',
    provider: 'google_detect',
    displayName: 'Google language detection',
    baseModel: 'cloud-translation-detect',
    notes: 'Primary detect when Google key is set.',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    role: 'primary',
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
    slug: 'vendor-chat-openai',
    feature: 'chat',
    provider: 'openai_chat',
    displayName: 'OpenAI Chat Completions',
    baseModel: 'gpt-4o-mini',
    notes: 'Default chat adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'primary',
  },
  {
    slug: 'vendor-chat-openrouter',
    feature: 'chat',
    provider: 'openrouter_chat',
    displayName: 'OpenRouter (OpenAI-compatible fallback)',
    baseModel: 'openai/gpt-4o-mini',
    notes: 'VL-129 optional chat fallback when OPENROUTER_API_KEY is set. Not a multi-LLM product.',
    envKey: 'OPENROUTER_API_KEY',
    role: 'fallback',
  },
  {
    slug: 'vendor-embeddings-openai',
    feature: 'embeddings',
    provider: 'openai_embeddings',
    displayName: 'OpenAI Embeddings',
    baseModel: 'text-embedding-3-small',
    notes: 'Default embedding adapter.',
    envKey: 'OPENAI_API_KEY',
    role: 'primary',
  },
];

export function envConfigured(envKey: string | null): boolean {
  if (!envKey) return true;
  if (envKey === 'GOOGLE_VISION_API_KEY') {
    return Boolean(process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY);
  }
  return Boolean(process.env[envKey]);
}

export function isModelFeature(value: string): value is ModelFeature {
  return (MODEL_FEATURES as readonly string[]).includes(value);
}

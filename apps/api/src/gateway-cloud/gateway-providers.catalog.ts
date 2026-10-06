import { ownTtsConfigured } from '../gateway/own-tts.adapter';

export type GatewayProviderStatus = 'shipped' | 'optional' | 'deferred';

export type GatewayProviderRow = {
  id: string;
  libraryName: string;
  status: GatewayProviderStatus;
  features: string[];
  configured: boolean;
  envKey: string | null;
  notes: string;
};

function envSet(key: string | null): boolean {
  if (!key) return true;
  if (key === 'GOOGLE_VISION_API_KEY') {
    return Boolean(process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY);
  }
  if (key === 'OWN_TTS_URL') return ownTtsConfigured();
  return Boolean(process.env[key]?.trim());
}

/** Provider map — Lugemi families first; legacy adapters stay silent / unbranded. */
export function gatewayProviderCatalog(): GatewayProviderRow[] {
  const rows: Array<Omit<GatewayProviderRow, 'configured'> & { envKey: string | null }> = [
    {
      id: 'lugemi_baobab',
      libraryName: 'Lugemi Baobab',
      status: 'shipped',
      features: ['translate'],
      envKey: null,
      notes: 'Proprietary MT — local engine + optional LUGEMI_MT_URL.',
    },
    {
      id: 'lugemi_atlas',
      libraryName: 'Lugemi Atlas',
      status: 'shipped',
      features: ['chat'],
      envKey: null,
      notes: 'Proprietary reasoning LLM — local engine + optional LUGEMI_CHAT_URL.',
    },
    {
      id: 'lugemi_echo_listen',
      libraryName: 'Lugemi Echo Listen',
      status: 'shipped',
      features: ['stt'],
      envKey: null,
      notes: 'Proprietary ASR — local engine + optional LUGEMI_ASR_URL.',
    },
    {
      id: 'lugemi_echo_voice',
      libraryName: 'Lugemi Echo Voice',
      status: 'shipped',
      features: ['tts'],
      envKey: 'OWN_TTS_URL',
      notes: 'own:* Africa-first voices — local path always ready.',
    },
    {
      id: 'lugemi_vector',
      libraryName: 'Lugemi Vector',
      status: 'shipped',
      features: ['embeddings'],
      envKey: null,
      notes: 'Proprietary embeddings — local engine + optional LUGEMI_EMBED_URL.',
    },
    {
      id: 'lugemi_lid',
      libraryName: 'Lugemi Lid',
      status: 'shipped',
      features: ['detect'],
      envKey: null,
      notes: 'Africa-aware language identification — always on.',
    },
    {
      id: 'lugemi_vision',
      libraryName: 'Lugemi Vision',
      status: 'shipped',
      features: ['ocr'],
      envKey: null,
      notes: 'Document OCR product surface; optional LUGEMI_OCR_URL.',
    },
    {
      id: 'legacy_chat',
      libraryName: 'Legacy chat adapter',
      status: 'optional',
      features: ['chat'],
      envKey: 'OPENAI_API_KEY',
      notes: 'Silent fallback only — not branded in product UI.',
    },
    {
      id: 'legacy_stt',
      libraryName: 'Legacy STT adapter',
      status: 'optional',
      features: ['stt'],
      envKey: 'OPENAI_API_KEY',
      notes: 'Silent fallback only — not branded in product UI.',
    },
    {
      id: 'legacy_tts',
      libraryName: 'Legacy stock TTS adapter',
      status: 'optional',
      features: ['tts'],
      envKey: 'OPENAI_API_KEY',
      notes: 'Silent fallback for stock voice ids — not branded in product UI.',
    },
    {
      id: 'legacy_embed',
      libraryName: 'Legacy embeddings adapter',
      status: 'optional',
      features: ['embeddings'],
      envKey: 'OPENAI_API_KEY',
      notes: 'Silent fallback only — not branded in product UI.',
    },
    {
      id: 'legacy_mt',
      libraryName: 'Legacy MT adapter',
      status: 'optional',
      features: ['translate', 'detect'],
      envKey: 'GOOGLE_TRANSLATE_API_KEY',
      notes: 'Silent fallback only — not branded in product UI.',
    },
    {
      id: 'legacy_ocr',
      libraryName: 'Legacy OCR adapter',
      status: 'optional',
      features: ['ocr'],
      envKey: 'GOOGLE_VISION_API_KEY',
      notes: 'Silent fallback only — not branded in product UI.',
    },
    {
      id: 'legacy_chat_alt',
      libraryName: 'Legacy chat fallback adapter',
      status: 'optional',
      features: ['chat'],
      envKey: 'OPENROUTER_API_KEY',
      notes: 'Silent fallback only — not branded in product UI.',
    },
    {
      id: 'vendor_clone',
      libraryName: 'Instant Voice Cloning',
      status: 'optional',
      features: ['tts'],
      envKey: 'VENDOR_VOICE_CLONE_API_KEY',
      notes: 'Consent + watermark required.',
    },
  ];

  return rows.map((row) => ({
    ...row,
    configured: row.status === 'deferred' ? false : envSet(row.envKey),
  }));
}

export function gatewayCapabilities() {
  return {
    modelRouting: ['lugemi_families', 'finetune_pair_routes', 'tts_voice_prefix'],
    fallback: [
      'detect_lid_local',
      'translate_finetune_to_baobab',
      'chat_atlas_to_silent_legacy',
    ],
    caching: { responseCache: false, finetuneReadyPairMemory: true },
    costOptimization: false,
    latencyOptimization: ['timeouts', 'translate_retry_429_5xx'],
    streaming: false,
    customModels: ['finetune_phrase_map', 'finetune_http_endpoint', 'own_tts_url', 'lugemi_mt_url'],
  };
}

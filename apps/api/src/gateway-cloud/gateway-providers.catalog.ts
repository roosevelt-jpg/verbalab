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

/** Library Phase 5 provider map — honest configured flags. */
export function gatewayProviderCatalog(): GatewayProviderRow[] {
  const rows: Array<Omit<GatewayProviderRow, 'configured'> & { envKey: string | null }> = [
    {
      id: 'openai',
      libraryName: 'OpenAI',
      status: 'shipped',
      features: ['chat', 'stt', 'tts', 'embeddings'],
      envKey: 'OPENAI_API_KEY',
      notes: 'Primary chat/STT/TTS/embeddings.',
    },
    {
      id: 'whisper',
      libraryName: 'Whisper',
      status: 'shipped',
      features: ['stt'],
      envKey: 'OPENAI_API_KEY',
      notes: 'Via OpenAI Whisper adapter.',
    },
    {
      id: 'google_translate',
      libraryName: 'Google Translate / Detect',
      status: 'shipped',
      features: ['translate', 'detect'],
      envKey: 'GOOGLE_TRANSLATE_API_KEY',
      notes: 'Default MT + detect primary.',
    },
    {
      id: 'google_vision',
      libraryName: 'Google Vision',
      status: 'shipped',
      features: ['ocr'],
      envKey: 'GOOGLE_VISION_API_KEY',
      notes: 'OCR; may reuse translate key.',
    },
    {
      id: 'openrouter',
      libraryName: 'OpenRouter',
      status: 'optional',
      features: ['chat'],
      envKey: 'OPENROUTER_API_KEY',
      notes: 'Optional OpenAI-compatible chat fallback.',
    },
    {
      id: 'own_tts',
      libraryName: 'Custom / rented TTS',
      status: 'optional',
      features: ['tts'],
      envKey: 'OWN_TTS_URL',
      notes: 'own:* voices.',
    },
    {
      id: 'vendor_clone',
      libraryName: 'Vendor voice clone',
      status: 'optional',
      features: ['tts'],
      envKey: 'VENDOR_VOICE_CLONE_API_KEY',
      notes: 'Voice clones. Legacy ELEVENLABS_API_KEY still accepted.',
    },
    {
      id: 'claude',
      libraryName: 'Claude',
      status: 'deferred',
      features: ['chat'],
      envKey: null,
      notes: 'Buy when contracted — not a first-class adapter.',
    },
    {
      id: 'gemini',
      libraryName: 'Gemini',
      status: 'deferred',
      features: ['chat'],
      envKey: null,
      notes: 'Buy when contracted — not a first-class adapter.',
    },
    {
      id: 'deepseek',
      libraryName: 'DeepSeek',
      status: 'deferred',
      features: ['chat'],
      envKey: null,
      notes: 'Reachable later via OpenRouter model ids if needed.',
    },
    {
      id: 'qwen',
      libraryName: 'Qwen',
      status: 'deferred',
      features: ['chat'],
      envKey: null,
      notes: 'Deferred first-class adapter.',
    },
    {
      id: 'llama',
      libraryName: 'Llama',
      status: 'deferred',
      features: ['chat'],
      envKey: null,
      notes: 'Deferred first-class adapter.',
    },
    {
      id: 'mistral',
      libraryName: 'Mistral',
      status: 'deferred',
      features: ['chat'],
      envKey: null,
      notes: 'Deferred first-class adapter.',
    },
    {
      id: 'nemo',
      libraryName: 'NeMo',
      status: 'deferred',
      features: ['speech'],
      envKey: null,
      notes: 'Not in scope — no NeMo runtime.',
    },
  ];

  return rows.map((row) => ({
    ...row,
    configured: row.status === 'deferred' ? false : envSet(row.envKey),
  }));
}

export function gatewayCapabilities() {
  return {
    modelRouting: ['feature_adapters', 'finetune_pair_routes', 'tts_voice_prefix'],
    fallback: ['detect_google_to_franc', 'translate_finetune_to_google', 'chat_openai_to_openrouter'],
    caching: { responseCache: false, finetuneReadyPairMemory: true },
    costOptimization: false,
    latencyOptimization: ['timeouts', 'translate_retry_429_5xx'],
    streaming: false,
    customModels: ['finetune_phrase_map', 'finetune_http_endpoint', 'own_tts_url'],
  };
}

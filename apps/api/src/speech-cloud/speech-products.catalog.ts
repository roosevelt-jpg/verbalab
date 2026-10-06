export type SpeechProductStatus = 'shipped' | 'partial' | 'deferred';

export type SpeechProductRow = {
  id: string;
  name: string;
  status: SpeechProductStatus;
  api: string | null;
  console: string | null;
  notes: string;
};

/** Library Phase 16 product map (VL-150). Hub only — does not reimplement STT/TTS. */
export function speechProductCatalog(): SpeechProductRow[] {
  return [
    {
      id: 'speech',
      name: 'VerbaLab Speech',
      status: 'shipped',
      api: 'GET /v1/speech/products',
      console: '/speech',
      notes: 'Speech Cloud parent hub (VL-150). Maps library products onto existing audio surfaces.',
    },
    {
      id: 'speech-engine',
      name: 'Speech Recognition Engine',
      status: 'shipped',
      api: 'GET /v1/speech/engine',
      console: '/speech-recognition',
      notes: 'Batch + segment SSE STT, vocabulary, subtitles (VL-151).',
    },
    {
      id: 'batch-stt',
      name: 'Batch STT',
      status: 'shipped',
      api: 'POST /v1/speech/recognize',
      console: '/speech-recognition',
      notes: 'File STT + timestamps/confidence/vocab (VL-041/151). Legacy: POST /v1/audio/transcriptions.',
    },
    {
      id: 'streaming-stt',
      name: 'Streaming STT',
      status: 'partial',
      api: 'POST /v1/speech/stream',
      console: '/speech-recognition',
      notes: 'SSE segment stream over Whisper verbose_json (VL-151). Not live mic WebSocket.',
    },
    {
      id: 'tts',
      name: 'Text-to-speech',
      status: 'shipped',
      api: 'POST /v1/audio/speech',
      console: '/audio',
      notes: 'Vendor + own TTS voices (VL-042/121). Character metering.',
    },
    {
      id: 'voices',
      name: 'Voice catalog',
      status: 'shipped',
      api: 'GET /v1/audio/voices',
      console: '/audio',
      notes: 'Public voice list for synthesis.',
    },
    {
      id: 'interpret',
      name: 'Live interpreter',
      status: 'shipped',
      api: 'POST /v1/interpret',
      console: '/interpret',
      notes: 'STT → MT → TTS compose (VL-061). Not contact-center Call Intelligence.',
    },
    {
      id: 'voice-biometrics',
      name: 'Voice Biometrics',
      status: 'partial',
      api: '/v1/voice-clones',
      console: '/audio',
      notes: 'Consent-gated voice cloning (VL-064). Not speaker verification / anti-spoof biometrics OS.',
    },
    {
      id: 'voice-faq',
      name: 'Voice agents (FAQ)',
      status: 'partial',
      api: '/v1/voice',
      console: '/voice',
      notes: 'Twilio FAQ voice agent (VL-080 area). Call Intelligence analytics deferred to Phase 24.',
    },
    {
      id: 'speaker-intelligence',
      name: 'Speaker Intelligence',
      status: 'partial',
      api: 'GET /v1/speakers/engine',
      console: '/speaker-intelligence',
      notes:
        'Profiles, local fingerprints, verify/identify, gap diarization (VL-152). Not NIST biometrics / neural diarization.',
    },
    {
      id: 'accent-intelligence',
      name: 'Accent Intelligence',
      status: 'partial',
      api: 'GET /v1/accents/engine',
      console: '/accent-intelligence',
      notes:
        'Cue detection/classify + analytics (VL-132/153). Dialect via Language Cloud. Acoustic regional models deferred.',
    },
    {
      id: 'emotion-ai',
      name: 'Emotion AI',
      status: 'partial',
      api: 'GET /v1/emotion/engine',
      console: '/emotion-intelligence',
      notes:
        'Speech emotion detect + SSE (VL-154). Text cues + soft audio proxies — not trained SER. Language Intel emotion remains separate.',
    },
    {
      id: 'audio-intelligence',
      name: 'Audio Intelligence',
      status: 'partial',
      api: 'GET /v1/audio-intelligence/engine',
      console: '/audio-intelligence',
      notes:
        'Noise/silence analyze, gate enhance, linear upscale, VAD isolate (VL-155). Echo AEC deferred. Not Krisp/Demucs.',
    },
    {
      id: 'pronunciation-ai',
      name: 'Pronunciation AI',
      status: 'partial',
      api: 'GET /v1/pronunciation/engine',
      console: '/pronunciation-intelligence',
      notes:
        'Assess/score/coach + phoneme/fluency heuristics (VL-156). Not ELSA/SpeechAce / forced alignment.',
    },
    {
      id: 'wake-word',
      name: 'Wake Word Engine',
      status: 'partial',
      api: 'GET /v1/wake-word/engine',
      console: '/wake-word',
      notes:
        'Wake/keyword/trigger spotting via text/STT (VL-157). Not Porcupine on-device DNN.',
    },
    {
      id: 'call-intelligence',
      name: 'Call Intelligence',
      status: 'partial',
      api: 'GET /v1/call-intelligence/engine',
      console: '/call-intelligence',
      notes:
        'Call ingest/transcribe/analyze/report (VL-158). Heuristic coaching/QA/compliance. Not Gong. Voice FAQ ≠ this.',
    },
    {
      id: 'audio-enhancement',
      name: 'Audio Enhancement',
      status: 'partial',
      api: 'POST /v1/audio-intelligence/enhance',
      console: '/audio-intelligence',
      notes:
        'Noise-gate enhance under Audio Intelligence (VL-155). Not spectral ML denoise / Adobe Enhance.',
    },
    {
      id: 'speech-analytics',
      name: 'Speech Analytics',
      status: 'partial',
      api: 'GET /v1/speech-analytics/engine',
      console: '/speech-analytics',
      notes:
        'Usage/languages/dialects/costs/accuracy proxies/report (VL-159). Not BI cloud or WER lab. Language Analytics separate.',
    },
  ];
}

export function speechArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_speech_cloud_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_via_existing_modules',
    eventDriven: 'audit_and_jobs_only',
    rest: true,
    graphql: true,
    realtime: true,
    streaming: true,
    batch: true,
    enterpriseApis: true,
    sdk: '@verbalab/sdk',
    cli: '@verbalab/cli',
    openapi: '/v1/openapi.json',
    monitoring: true,
    billing: true,
    analytics: 'usage_summary_only',
    infra: ['docker', 'fly', 'github_actions', 'terraform', 'eks'],
    terraform: true,
    kubernetes: true,
    docker: true,
    cloudProvider: 'aws',
    primaryRegion: 'af-south-1',
  };
}

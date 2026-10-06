export type SpeechCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type SpeechCapability = {
  id: string;
  name: string;
  status: SpeechCapabilityStatus;
  api: string | null;
  notes: string;
};

/** Lugemi Speech Recognition Engine. */
export function speechEngineCatalog() {
  return {
    product: 'Lugemi Speech',
    note:
      'Recognition engine over OpenAI Whisper (batch + segment SSE). Not Deepgram/AssemblyAI parity. True low-latency vendor WebSocket streaming remains buy/ depth.',
    capabilities: [
      {
        id: 'batch-stt',
        name: 'Batch Speech-to-Text',
        status: 'shipped',
        api: 'POST /v1/speech/recognize',
        notes: 'File STT with timestamps, confidence, vocabulary prompt. Legacy: POST /v1/audio/transcriptions.',
      },
      {
        id: 'streaming-stt',
        name: 'Streaming Speech-to-Text',
        status: 'partial',
        api: 'POST /v1/speech/stream',
        notes: 'SSE segment stream after Whisper verbose_json. Not live microphone WebSocket.',
      },
      {
        id: 'realtime',
        name: 'Realtime APIs',
        status: 'partial',
        api: 'POST /v1/speech/stream',
        notes: 'SSE realtime delivery of segments. Bidirectional realtime sessions deferred.',
      },
      {
        id: 'multilingual',
        name: 'Multilingual Recognition',
        status: 'shipped',
        api: 'POST /v1/speech/recognize',
        notes: 'ISO-639-1 language hint; Whisper multilingual models.',
      },
      {
        id: 'language-detect',
        name: 'Automatic Language Detection',
        status: 'shipped',
        api: 'POST /v1/speech/recognize',
        notes: 'Omit language for Whisper auto-detect.',
      },
      {
        id: 'custom-vocabulary',
        name: 'Custom Vocabulary',
        status: 'shipped',
        api: '/v1/speech/vocabulary',
        notes: 'Workspace phrases primed via Whisper prompt (soft boost, not hard lexicon).',
      },
      {
        id: 'industry-vocabulary',
        name: 'Industry Vocabulary',
        status: 'shipped',
        api: 'GET /v1/speech/vocabulary/packs',
        notes: 'Medical, legal, financial, government phrase packs.',
      },
      {
        id: 'subtitles',
        name: 'Subtitle Generation',
        status: 'shipped',
        api: 'POST /v1/speech/subtitles',
        notes: 'SRT / WebVTT from timed segments.',
      },
      {
        id: 'punctuation',
        name: 'Punctuation',
        status: 'shipped',
        api: 'POST /v1/speech/recognize',
        notes: 'Whisper punctuated output + optional normalize.',
      },
      {
        id: 'capitalization',
        name: 'Capitalization',
        status: 'shipped',
        api: 'POST /v1/speech/recognize',
        notes: 'Sentence capitalization normalize option.',
      },
      {
        id: 'timestamps',
        name: 'Timestamping',
        status: 'shipped',
        api: 'POST /v1/speech/recognize',
        notes: 'Segment start/end seconds from verbose_json.',
      },
      {
        id: 'confidence',
        name: 'Confidence Scores',
        status: 'shipped',
        api: 'POST /v1/speech/recognize',
        notes: 'Per-segment and aggregate proxy from Whisper avg_logprob.',
      },
      {
        id: 'monitoring',
        name: 'Monitoring',
        status: 'shipped',
        api: 'shared observability',
        notes: 'Request IDs, gateway.transcribe logs, audit audio.transcribed / speech.recognized.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'partial',
        api: 'GET /v1/speech/engine/analytics',
        notes: 'STT usage summary for the org. Dedicated Speech Analytics: /v1/speech-analytics.',
      },
    ] satisfies SpeechCapability[],
    engines: [
      {
        id: 'openai_whisper',
        name: 'OpenAI Whisper',
        role: 'primary',
        modes: ['batch', 'segment_sse'],
      },
    ],
    links: {
      console: '/speech-recognition',
      hub: '/speech',
      legacy: '/audio',
      openapi: '/v1/openapi.json',
      docs: '/docs/SPEECH_RECOGNITION.md',
    },
    architecture: {
      rest: true,
      graphql: true,
      sdk: '@lugemi/sdk',
      cli: '@lugemi/cli',
      docker: true,
      terraform: true,
      kubernetes: true,
      primaryRegion: 'af-south-1',
      deployment: 'Fly default; optional EKS af-south-1 (shared platform)',
    },
  };
}

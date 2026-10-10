/** Public SDK/CLI/MCP/mobile catalog for docs and developer hub. */
export function sdkCatalog() {
  return {
    typescript: {
      name: '@lugemi/sdk',
      version: '0.1.0',
      install: 'pnpm add @lugemi/sdk',
      private: true,
      note: 'TypeScript SDK for speech, translate, and platform APIs.',
    },
    cli: {
      name: '@lugemi/cli',
      version: '0.1.0',
      bin: 'lugemi',
      install: 'pnpm add -g @lugemi/cli',
      commands: ['speech', 'video-voice', 'voices', 'translate', 'languages', 'whoami'],
      note: 'CLI for video/content pipelines and ops scripts.',
    },
    mcp: {
      name: '@lugemi/mcp',
      version: '0.3.0',
      bin: 'lugemi-mcp',
      install: 'pnpm --filter @lugemi/mcp build',
      endpoint: 'POST /v1/mcp',
      docs: '/mcp',
      tools: [
        'lugemi_translate',
        'lugemi_tts_synthesize',
        'lugemi_speech_synthesize',
        'lugemi_transcribe',
        'lugemi_mix_transcribe_translate',
        'lugemi_video_voice_line',
        'lugemi_voices_list',
        'lugemi_voice_clones_list',
        'lugemi_languages_list',
        'lugemi_accents_list',
        'lugemi_accent_identity_list',
        'lugemi_accent_identity_play',
        'lugemi_models_list',
      ],
      models: ['Baobab', 'Echo', 'Atlas'],
      note: 'Lugemi MCP — stdio package + hosted Streamable HTTP for agent IDEs.',
    },
    android: {
      name: 'com.lugemi:sdk',
      language: 'Kotlin',
      path: 'packages/sdk-android',
      methods: ['speech', 'translate', 'languages', 'voices', 'videoVoiceLine'],
      note: 'Android HTTP client for speech + translate (same REST surface).',
    },
    ios: {
      name: 'Lugemi',
      language: 'Swift',
      path: 'packages/sdk-ios',
      methods: ['speech', 'translate', 'languages', 'voices', 'videoVoiceLine'],
      note: 'Swift Package for iOS/macOS speech + translate.',
    },
    auth: {
      livePrefix: 'lg_live_',
      testPrefix: 'lg_test_',
    },
  };
}

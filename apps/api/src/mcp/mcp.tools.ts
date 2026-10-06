/** Lugemi MCP tool schemas (API + package must stay aligned). */

export const MCP_SERVER_INFO = {
  name: 'lugemi-mcp',
  version: '0.3.0',
} as const;

export const MCP_PROTOCOL_VERSION = '2024-11-05';

export type McpToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const MCP_TOOLS: McpToolDef[] = [
  {
    name: 'lugemi_translate',
    description: 'Translate text with Lugemi Baobab (Africa-first MT). Use for dubbing scripts, captions, and localization.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Source text' },
        source: { type: 'string', description: 'Source language code or auto (default auto)' },
        target: { type: 'string', description: 'Target language code (e.g. ak, sw, yo)' },
      },
      required: ['text', 'target'],
    },
  },
  {
    name: 'lugemi_tts_synthesize',
    description: 'Synthesize speech with Lugemi Echo Voice (first-party TTS). Prefer own:* voices. Returns base64 audio.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        voice: { type: 'string' },
        language: { type: 'string' },
        format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
        accentId: { type: 'string' },
        outPath: { type: 'string' },
      },
      required: ['text', 'voice'],
    },
  },
  {
    name: 'lugemi_speech_synthesize',
    description: 'Alias of lugemi_tts_synthesize — Echo Voice TTS for video/script lines.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        voice: { type: 'string' },
        language: { type: 'string' },
        format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
        accentId: { type: 'string' },
        outPath: { type: 'string' },
      },
      required: ['text', 'voice'],
    },
  },
  {
    name: 'lugemi_transcribe',
    description: 'Speech-to-text with Lugemi Echo Listen (ASR). Pass audioBase64 + filename, or filePath on stdio hosts.',
    inputSchema: {
      type: 'object',
      properties: {
        audioBase64: { type: 'string' },
        filename: { type: 'string' },
        filePath: { type: 'string' },
        language: { type: 'string' },
      },
      required: [],
    },
  },
  {
    name: 'lugemi_mix_transcribe_translate',
    description: 'Lugemi Mix: transcribe mixed-language speech then translate (Echo + Baobab). Use textHint for local demos without audio.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string' },
        textHint: { type: 'string' },
        audioBase64: { type: 'string' },
        filename: { type: 'string' },
        filePath: { type: 'string' },
        sourceHints: { type: 'array', items: { type: 'string' } },
        varietyId: { type: 'string' },
      },
      required: ['target'],
    },
  },
  {
    name: 'lugemi_video_voice_line',
    description: 'Video pipeline helper: Baobab translate then Echo synthesize in one call.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        source: { type: 'string' },
        target: { type: 'string' },
        voice: { type: 'string' },
        format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
        outPath: { type: 'string' },
      },
      required: ['text', 'target', 'voice'],
    },
  },
  { name: 'lugemi_voices_list', description: 'List available Lugemi own:* voices for Echo Voice TTS.', inputSchema: { type: 'object', properties: {} } },
  { name: 'lugemi_voice_clones_list', description: 'List workspace voice clone refs (use voice=clone:{id} with TTS tools).', inputSchema: { type: 'object', properties: {} } },
  { name: 'lugemi_languages_list', description: 'List Lugemi registry languages available for translate + speech.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'lugemi_accents_list',
    description: 'List spoken accent profiles (optional language filter).',
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string' },
        includeIdentity: { type: 'boolean' },
      },
    },
  },
  {
    name: 'lugemi_accent_identity_list',
    description: 'List accent identity packs (tribe/culture/region speech identity metadata for Echo Voice demos).',
    inputSchema: {
      type: 'object',
      properties: {
        country: { type: 'string' },
        region: { type: 'string' },
        language: { type: 'string' },
        q: { type: 'string' },
      },
    },
  },
  {
    name: 'lugemi_accent_identity_play',
    description: 'Accent identity play metadata for a pack id. Optionally synthesize the sample.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        synthesize: { type: 'boolean' },
        format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac', 'flac'] },
        outPath: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'lugemi_models_list',
    description: 'List first-party Lugemi model families — Baobab, Echo, Atlas — and live readiness.',
    inputSchema: {
      type: 'object',
      properties: { feature: { type: 'string' } },
    },
  },
];

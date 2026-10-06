#!/usr/bin/env node
/**
 * Lugemi MCP server (stdio JSON-RPC).
 * For video generation platforms and agent IDEs to synthesize voice + translate
 * scripts into any Lugemi-supported language for content production.
 *
 * Env: LUGEMI_API_KEY (required), LUGEMI_BASE_URL (optional)
 */
import { Lugemi } from '@lugemi/sdk';
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY ?? '',
  baseUrl: process.env.LUGEMI_BASE_URL ?? 'https://api.lugemi.com',
});

const TOOLS = [
  {
    name: 'lugemi_speech_synthesize',
    description:
      'Synthesize speech audio for a video/script line. Prefer own:* African voices. Returns base64 audio + mimeType for editors.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Script or dialogue line' },
        voice: {
          type: 'string',
          description: 'Voice id, e.g. own:ak-gh-female or own:sw-ke-female',
        },
        language: { type: 'string', description: 'BCP-47 / language code, e.g. ak, sw, yo' },
        format: {
          type: 'string',
          enum: ['mp3', 'wav', 'opus', 'aac', 'flac'],
          description: 'Audio container (default mp3)',
        },
        outPath: {
          type: 'string',
          description: 'Optional filesystem path to write the audio file on the MCP host',
        },
      },
      required: ['text', 'voice'],
    },
  },
  {
    name: 'lugemi_translate',
    description: 'Translate text for dubbing, subtitles, or localization into any Lugemi language.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        source: { type: 'string', description: 'Source language or auto' },
        target: { type: 'string', description: 'Target language code (e.g. ak for Twi)' },
      },
      required: ['text', 'target'],
    },
  },
  {
    name: 'lugemi_video_voice_line',
    description:
      'Video pipeline helper: translate a line then synthesize speech in one call (dubbing / content production).',
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
  {
    name: 'lugemi_voices_list',
    description: 'List available Lugemi voices for video/content production.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'lugemi_languages_list',
    description: 'List languages available for translate + speech.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString('base64');
}

async function synthesize(args: Record<string, unknown>) {
  const speech = await client.speech({
    text: String(args.text ?? ''),
    voice: String(args.voice ?? 'own:ak-gh-female'),
    language: args.language ? String(args.language) : undefined,
    format: (args.format as 'mp3' | 'wav' | 'opus' | 'aac' | 'flac' | undefined) ?? 'mp3',
  });
  const outPath = args.outPath ? String(args.outPath) : null;
  if (outPath) {
    writeFileSync(outPath, speech.audio);
  }
  return {
    mimeType: speech.mimeType,
    voice: speech.voice,
    provider: speech.provider,
    characters: speech.characters,
    watermarkApplied: speech.watermarkApplied,
    audioBase64: toBase64(speech.audio),
    byteLength: speech.audio.byteLength,
    outPath,
  };
}

async function handleTool(name: string, args: Record<string, unknown>) {
  if (!process.env.LUGEMI_API_KEY) {
    return {
      content: [
        {
          type: 'text',
          text: 'Set LUGEMI_API_KEY (lg_live_… or lg_test_…) to call Lugemi from video pipelines.',
        },
      ],
      isError: true,
    };
  }

  if (name === 'lugemi_speech_synthesize') {
    const result = await synthesize(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  if (name === 'lugemi_translate') {
    const translated = await client.translate({
      text: String(args.text ?? ''),
      source: String(args.source ?? 'auto'),
      target: String(args.target ?? 'ak'),
    });
    return { content: [{ type: 'text', text: JSON.stringify(translated, null, 2) }] };
  }

  if (name === 'lugemi_video_voice_line') {
    const target = String(args.target ?? 'ak');
    const translated = await client.translate({
      text: String(args.text ?? ''),
      source: String(args.source ?? 'auto'),
      target,
    });
    const audio = await synthesize({
      text: translated.text,
      voice: args.voice,
      language: target,
      format: args.format,
      outPath: args.outPath,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              translated: translated.text,
              source: translated.source,
              target,
              characters: translated.characters,
              audio,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  if (name === 'lugemi_voices_list') {
    const voices = await client.voices();
    return { content: [{ type: 'text', text: JSON.stringify(voices, null, 2) }] };
  }

  if (name === 'lugemi_languages_list') {
    const languages = await client.languages();
    return { content: [{ type: 'text', text: JSON.stringify(languages, null, 2) }] };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
}

function respond(id: string | number | null | undefined, result: unknown) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result })}\n`);
}

async function onMessage(line: string) {
  let msg: JsonRpc;
  try {
    msg = JSON.parse(line) as JsonRpc;
  } catch {
    return;
  }

  if (msg.method === 'initialize') {
    respond(msg.id, {
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'lugemi-mcp', version: '0.2.0' },
      capabilities: { tools: {} },
    });
    return;
  }

  if (msg.method === 'notifications/initialized' || msg.method === 'initialized') {
    return;
  }

  if (msg.method === 'tools/list') {
    respond(msg.id, { tools: TOOLS });
    return;
  }

  if (msg.method === 'tools/call') {
    const name = String(msg.params?.name ?? '');
    const args = (msg.params?.arguments as Record<string, unknown>) ?? {};
    try {
      respond(msg.id, await handleTool(name, args));
    } catch (err) {
      respond(msg.id, {
        content: [{ type: 'text', text: err instanceof Error ? err.message : 'Tool failed' }],
        isError: true,
      });
    }
    return;
  }

  if (msg.method === 'ping') {
    respond(msg.id, {});
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  void onMessage(line.trim()).catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  });
});

process.stderr.write('lugemi-mcp ready (stdio) — video voice + translate tools\n');

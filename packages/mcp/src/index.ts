#!/usr/bin/env node
/**
 * Lugemi MCP server (stdio JSON-RPC lite).
 * Video/agent platforms call tools: speech.synthesize, translate.text, languages.list
 *
 * Env: LUGEMI_API_KEY, LUGEMI_BASE_URL (optional)
 *
 * Full MCP SDK wiring can replace this transport; tool contracts stay stable.
 */
import { Lugemi } from '@lugemi/sdk';
import { createInterface } from 'node:readline';

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
    description: 'Generate speech audio metadata for a script in any supported language/voice (own:* preferred).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        voice: { type: 'string', description: 'e.g. own:sw-ke-female' },
        language: { type: 'string' },
      },
      required: ['text', 'voice'],
    },
  },
  {
    name: 'lugemi_translate',
    description: 'Translate text between languages with Lugemi first-party translate.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        source: { type: 'string' },
        target: { type: 'string' },
      },
      required: ['text', 'target'],
    },
  },
  {
    name: 'lugemi_languages_list',
    description: 'List languages available to the authenticated workspace.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function handleTool(name: string, args: Record<string, unknown>) {
  if (!process.env.LUGEMI_API_KEY) {
    return {
      content: [
        {
          type: 'text',
          text: 'Set LUGEMI_API_KEY to call Lugemi. Tool contracts are ready for video pipelines.',
        },
      ],
      isError: true,
    };
  }

  if (name === 'lugemi_speech_synthesize') {
    const speech = await client.speech({
      text: String(args.text ?? ''),
      voice: String(args.voice ?? 'own:sw-ke-female'),
      language: args.language ? String(args.language) : undefined,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(speech, null, 2) }],
    };
  }

  if (name === 'lugemi_translate') {
    const translated = await client.translate({
      text: String(args.text ?? ''),
      source: String(args.source ?? 'auto'),
      target: String(args.target ?? 'sw'),
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(translated, null, 2) }],
    };
  }

  if (name === 'lugemi_languages_list') {
    const languages = await client.languages();
    return {
      content: [{ type: 'text', text: JSON.stringify(languages, null, 2) }],
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
}

function respond(id: string | number | null | undefined, result: unknown) {
  const payload = { jsonrpc: '2.0', id: id ?? null, result };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
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
      serverInfo: { name: 'lugemi-mcp', version: '0.1.0' },
      capabilities: { tools: {} },
    });
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
      const result = await handleTool(name, args);
      respond(msg.id, result);
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

process.stderr.write('lugemi-mcp ready (stdio)\n');

#!/usr/bin/env node
/**
 * Lugemi MCP server (stdio JSON-RPC).
 * Env: LUGEMI_API_KEY (required, lg_live_… / lg_test_…), LUGEMI_BASE_URL (optional)
 */
import { createInterface } from 'node:readline';
import { LugemiMcpApi, handleMcpTool, mcpInitializeResult } from './api.js';
import { MCP_TOOLS } from './tools.js';

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const apiKey = process.env.LUGEMI_API_KEY ?? '';
const baseUrl = process.env.LUGEMI_BASE_URL ?? 'https://api.lugemi.com';
const api = new LugemiMcpApi({ apiKey, baseUrl });

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
    respond(msg.id, mcpInitializeResult());
    return;
  }
  if (msg.method === 'notifications/initialized' || msg.method === 'initialized') return;
  if (msg.method === 'tools/list') {
    respond(msg.id, { tools: MCP_TOOLS });
    return;
  }
  if (msg.method === 'tools/call') {
    const name = String(msg.params?.name ?? '');
    const args = (msg.params?.arguments as Record<string, unknown>) ?? {};
    if (!apiKey) {
      respond(msg.id, {
        content: [{ type: 'text', text: 'Set LUGEMI_API_KEY (lg_live_… or lg_test_…) to call Lugemi from agent IDEs.' }],
        isError: true,
      });
      return;
    }
    respond(msg.id, await handleMcpTool(api, name, args, { allowOutPath: true }));
    return;
  }
  if (msg.method === 'ping') respond(msg.id, {});
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  void onMessage(line.trim()).catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  });
});

process.stderr.write('lugemi-mcp ready (stdio) — Baobab translate · Echo speech · Atlas models · Mix\n');

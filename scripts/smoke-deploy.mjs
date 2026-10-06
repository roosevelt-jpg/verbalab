#!/usr/bin/env node
/**
 * Deploy smoke (polish #4): hit API + web /health.
 *
 * Default (services already running, e.g. `pnpm dev` or docker run):
 *   pnpm smoke
 *
 * Override URLs:
 *   SMOKE_API_URL=http://127.0.0.1:3001 SMOKE_WEB_URL=http://127.0.0.1:3000 pnpm smoke
 *
 * Optional Docker build + run web-only (no Postgres needed for web health):
 *   SMOKE_DOCKER_WEB=1 pnpm smoke
 */

import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const apiBase = (process.env.SMOKE_API_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
const webBase = (process.env.SMOKE_WEB_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

async function check(name, url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${name} ${url} → HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${name} ${url} → expected JSON, got: ${text.slice(0, 200)}`);
  }
  if (body.status !== 'ok') {
    throw new Error(`${name} ${url} → status not ok: ${JSON.stringify(body)}`);
  }
  console.log(`ok  ${name} ${url}`);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${result.status}`);
  }
}

async function maybeDockerWeb() {
  if (process.env.SMOKE_DOCKER_WEB !== '1') return null;

  const image = process.env.SMOKE_WEB_IMAGE ?? 'verbalab-web-smoke';
  const name = 'verbalab-web-smoke';
  console.log('Building web image…');
  run('docker', [
    'build',
    '-f',
    'apps/web/Dockerfile',
    '-t',
    image,
    '--build-arg',
    'NEXT_PUBLIC_API_URL=http://127.0.0.1:3001',
    '.',
  ]);
  spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore', shell: true });
  console.log('Starting web container…');
  run('docker', ['run', '-d', '--name', name, '-p', '3000:3000', image]);
  for (let i = 0; i < 30; i++) {
    try {
      await check('web', `${webBase}/health`);
      return name;
    } catch {
      await delay(1000);
    }
  }
  throw new Error('Web container health check timed out');
}

async function main() {
  let container = null;
  try {
    container = await maybeDockerWeb();
    if (!container) {
      await check('web', `${webBase}/health`);
    }
    if (process.env.SMOKE_SKIP_API === '1') {
      console.log('skip api (SMOKE_SKIP_API=1)');
    } else {
      await check('api', `${apiBase}/health`);
    }
    console.log('smoke passed');
  } finally {
    if (container) {
      spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore', shell: true });
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

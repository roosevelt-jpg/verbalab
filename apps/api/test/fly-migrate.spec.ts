import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const root = join(__dirname, '../../..');
const script = join(root, 'apps/api/scripts/fly-migrate.sh');

describe('fly-migrate.sh', () => {
  it('ships executable migrate helper used by Fly release_command', () => {
    expect(existsSync(script)).toBe(true);
    const text = readFileSync(script, 'utf8');
    expect(text).toContain('prisma migrate deploy');
    expect(text).toContain('DATABASE_URL');
  });

  it('soft-skips with exit 0 when DATABASE_URL is unset', () => {
    const env = { ...process.env };
    delete env.DATABASE_URL;
    const result = spawnSync('/bin/sh', [script], {
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toMatch(/DATABASE_URL unset/i);
  });
});

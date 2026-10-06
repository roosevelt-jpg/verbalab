import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('Secrets & Certificate Platform',  => {
  let app: INestApplication<App>;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
  }, 120_000);

  afterAll(async  => {
    await app.close;
  });

  it('ships ADR and product doc',  => {
    expect(existsSync(join(root, 'docs/adr/0222-secrets-certificate-platform.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/SECRETS_CERTIFICATE_PLATFORM.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source',  => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'secrets-certificate-platform');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/secrets-certificate-platform/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy;
    expect(res.body.honesty.encryptedAtRest).toBe(true);
    expect(res.body.honesty.executesInference).toBe(false);

    expect(res.body.honesty.encryptedAtRest).toBe(true);
    expect(res.body.honesty.neverLogPlaintextSecrets).toBe(true);
    expect(res.body.honesty.envelopeEncryptionPattern).toBe(true);
    expect(res.body.honesty.accessAuditing).toBe(true);
    expect(res.body.honesty.hashicorpVaultOs).toBe(false);

    const blob = JSON.stringify(res.body);
    expect(blob).not.toMatch(/sk_live_|sk_test_|whsec_|BEGIN (RSA |EC )?PRIVATE KEY|password\s*[:=]\s*['\"][^'\"]+['\"]/i);
    expect(blob).not.toMatch(/"ciphertext"\s*:/);
    expect(blob).not.toMatch(/"dekWrapped"\s*:/);

    const meta = await request(app.getHttpServer)
      .get('/v1/secrets-certificate-platform/metadata')
      .expect(200);
    expect(meta.body.secrets.length).toBeGreaterThan(0);
    expect(meta.body.secrets[0]).toHaveProperty('name');
    expect(meta.body.secrets[0]).toHaveProperty('version');
    expect(meta.body.secrets[0]).toHaveProperty('rotatedAt');
    expect(meta.body.secrets[0]).not.toHaveProperty('ciphertext');
    expect(meta.body.secrets[0]).not.toHaveProperty('value');
    expect(meta.body.secrets[0]).not.toHaveProperty('plaintext');

    const audit = await request(app.getHttpServer)
      .get('/v1/secrets-certificate-platform/audit')
      .expect(200);
    expect(audit.body.accessAuditing).toBe(true);
    expect(audit.body.entries.length).toBeGreaterThan(0);

  });

  it('exposes monitoring', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/secrets-certificate-platform/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy;
  });
});

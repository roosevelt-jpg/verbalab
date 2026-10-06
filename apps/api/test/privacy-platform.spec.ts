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
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      out.push(...walkTsFiles(p));
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

describe('Privacy Platform', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships ADR and product doc', () => {
    expect(existsSync(join(root, 'docs/adr/0198-privacy-platform.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/PRIVACY_PLATFORM.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'privacy-platform');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/privacy-platform/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy();
    expect(res.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);

    expect(res.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);

    const blocked = await request(app.getHttpServer())
      .get('/v1/privacy-platform/consent-check')
      .query({ id: 'priv-tk-restricted' })
      .expect(200);
    expect(blocked.body.allowed).toBe(false);

    const unverified = await request(app.getHttpServer())
      .get('/v1/privacy-platform/consent-check')
      .query({ id: 'priv-tk-unverified' })
      .expect(200);
    expect(unverified.body.allowed).toBe(false);

    await request(app.getHttpServer())
      .get('/v1/privacy-platform/release')
      .query({ id: 'priv-tk-restricted' })
      .expect(400);

    const ok = await request(app.getHttpServer())
      .get('/v1/privacy-platform/consent-check')
      .query({ id: 'priv-tk-ok' })
      .expect(200);
    expect(ok.body.allowed).toBe(true);

  });

  it('exposes monitoring', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/privacy-platform/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  });
});

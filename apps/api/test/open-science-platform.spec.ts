import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(__dirname, '../src');

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkTsFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('Open Science Platform', () => {
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

  it('documents Open Science Platform + ADR', () => {
    expect(existsSync(join(root, 'docs/OPEN_SCIENCE_PLATFORM.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0180-open-science-platform.md'))).toBe(true);
    const text = readFileSync(join(root, 'docs/OPEN_SCIENCE_PLATFORM.md'), 'utf8');
    expect(text).toContain('');
  });

  it('has no TODO/FIXME/implement-later markers', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'open-science-platform'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/open-science-platform/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi Open Science Platform');

    expect(res.body.honesty.traditionalKnowledgeConsentRequired).toBe(true);
    expect(res.body.safety.traditionalKnowledgeConsentRequired).toBe(true);

  });

  it('blocks restricted and unverified traditional-knowledge open releases', async () => {
    const blocked = await request(app.getHttpServer())
      .get('/v1/open-science-platform/check')
      .query({ id: 'os-dataset-restricted' })
      .expect(200);
    expect(blocked.body.allowed).toBe(false);

    const unverified = await request(app.getHttpServer())
      .get('/v1/open-science-platform/check')
      .query({ id: 'os-dataset-unverified' })
      .expect(200);
    expect(unverified.body.allowed).toBe(false);

    const attested = await request(app.getHttpServer())
      .get('/v1/open-science-platform/check')
      .query({ id: 'os-dataset-attested' })
      .expect(200);
    expect(attested.body.allowed).toBe(true);

    await request(app.getHttpServer())
      .get('/v1/open-science-platform/release')
      .query({ id: 'os-dataset-restricted' })
      .expect(400);
  });
});

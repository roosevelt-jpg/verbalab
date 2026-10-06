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

describe('African Language Registry', () => {
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

  it('documents African Language Registry + ADR', () => {
    expect(existsSync(join(root, 'docs/AFRICAN_LANGUAGE_REGISTRY.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0163-african-language-registry.md'))).toBe(true);
    const text = readFileSync(join(root, 'docs/AFRICAN_LANGUAGE_REGISTRY.md'), 'utf8');
  });

  it('has no TODO/FIXME/implement-later markers', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(join(apiSrc, 'african-language-registry'))) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine honesty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/african-language-registry/engine')
      .expect(200);
    expect(res.body.product).toBe('Lugemi African Language Registry');

    expect(res.body.honesty.coverageComplete).toBe(true);
    expect(res.body.honesty.everyAfricanLanguageRegistered).toBe(true);
    expect(res.body.honesty.qualityCertifiedPerTask).toBe(false);
    expect(res.body.counts.languages).toBeGreaterThan(100);
  });

  it('lists a comprehensive African language set', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/african-language-registry/languages')
      .expect(200);
    expect(res.body.count).toBeGreaterThan(100);
    expect(res.body.languages.some((l: { code: string }) => l.code === 'ak')).toBe(true);
    expect(res.body.languages.some((l: { code: string }) => l.code === 'sw')).toBe(true);
    expect(res.body.languages.some((l: { code: string }) => l.code === 'fon')).toBe(true);
  });
});

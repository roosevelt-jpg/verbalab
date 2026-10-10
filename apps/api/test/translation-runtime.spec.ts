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

describe('Translation Runtime', () => {
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
    expect(existsSync(join(root, 'docs/adr/0227-translation-runtime.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/TRANSLATION_RUNTIME.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'translation-runtime');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('does not embed full product business-logic trees', () => {
    const dir = join(apiSrc, 'translation-runtime');
    const bannedImpl = /class TranslateService|decodeAudioBuffer|whisper|tesseract|neuralTtsEngine|buildRagIndex|sentencePiece/i;
    const hits: string[] = [];
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (bannedImpl.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/translation-runtime/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy();
    expect(res.body.honesty.thinExecutionLayer).toBe(true);

    expect(res.body.honesty.thinExecutionLayer).toBe(true);
    expect(res.body.honesty.duplicatesProductLogic).toBe(false);
    expect(res.body.honesty.managesOrgsPoliciesBilling).toBe(false);
    expect(res.body.honesty.serviceMeshOs).toBe(false);
    expect(res.body.thinExecutionLayer).toBe(true);
    expect(res.body.duplicatesProductLogic).toBe(false);
    expect(Array.isArray(res.body.routesTo)).toBe(true);
    expect(res.body.routesTo.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.body.routesTo)).toContain('translate');
    expect(JSON.stringify(res.body.routesTo)).toContain('translate');

    const route = await request(app.getHttpServer())
      .get('/v1/translation-runtime/route')
      .expect(200);
    expect(route.body.thinExecutionLayer).toBe(true);
    expect(route.body.duplicatesProductLogic).toBe(false);
    expect(route.body.upstreamStatus.length).toBeGreaterThan(0);

  });

  it('exposes monitoring', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/translation-runtime/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  });
});

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

describe('AI Drift Detection (VL-288)', () => {
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
    expect(existsSync(join(root, 'docs/adr/0190-ai-drift-detection.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/AI_DRIFT_DETECTION.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'ai-drift-detection');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/ai-drift-detection/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy();

    expect(res.body.honesty.usedAsContinuousLearningPromoteGate).toBe(true);
    expect(typeof res.body.driftClear).toBe('boolean');
  });

  it('exposes monitoring', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/ai-drift-detection/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  });

  it('exposes drift check API for Continuous Learning promote', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-drift-detection/check').expect(200);
    expect(typeof res.body.driftClear).toBe('boolean');
    expect(res.body.honesty.usedAsContinuousLearningPromoteGate).toBe(true);
  });
});

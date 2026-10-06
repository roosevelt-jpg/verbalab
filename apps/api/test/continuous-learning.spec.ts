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

describe('Continuous Learning', () => {
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
    expect(existsSync(join(root, 'docs/adr/0191-continuous-learning.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CONTINUOUS_LEARNING.md'))).toBe(true);
  });

  it('has no TODO/FIXME markers in hub source', () => {
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    const dir = join(apiSrc, 'continuous-learning');
    for (const file of walkTsFiles(dir)) {
      const text = readFileSync(file, 'utf8');
      if (banned.test(text)) hits.push(file.replace(root, ''));
    }
    expect(hits).toEqual([]);
  });

  it('exposes engine/products with honesty gates', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/continuous-learning/engine')
      .expect(200);
    expect(res.body.product).toBeTruthy();

    expect(res.body.honesty.humanApprovalRequiredBeforePromote).toBe(true);
    expect(res.body.honesty.poisonedInputGuard).toBe(true);
    expect(res.body.honesty.requiresDriftClear).toBe(true);
    expect(res.body.honesty.requiresContinuousEvalPass).toBe(true);
    expect(res.body.honesty.autoPromote).toBe(false);
  });

  it('exposes monitoring', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/continuous-learning/monitoring')
      .expect(200);
    expect(res.body).toBeTruthy();
  });

  it('allows promote only when all gates pass', async () => {
    const ok = await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote-check')
      .query({ id: 'promo-ready-001' })
      .expect(200);
    expect(ok.body.allowed).toBe(true);
    expect(ok.body.autoPromote).toBe(false);
    expect(ok.body.humanApprovalRequiredBeforePromote).toBe(true);
    expect(ok.body.poisonedInputGuard).toBe(true);
    expect(ok.body.requiresDriftClear).toBe(true);
    expect(ok.body.requiresContinuousEvalPass).toBe(true);

    const blockedHuman = await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote-check')
      .query({ id: 'promo-blocked-human-001' })
      .expect(200);
    expect(blockedHuman.body.allowed).toBe(false);

    const blockedPoison = await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote-check')
      .query({ id: 'promo-blocked-poison-001' })
      .expect(200);
    expect(blockedPoison.body.allowed).toBe(false);

    await request(app.getHttpServer())
      .get('/v1/continuous-learning/promote')
      .query({ id: 'promo-blocked-human-001' })
      .expect(400);
  });
});

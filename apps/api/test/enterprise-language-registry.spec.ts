import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

describe('Enterprise Language Registry',  => {
  let app: INestApplication<App>;

  beforeAll(async  => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;
    app = moduleRef.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
  }, 120_000);

  afterAll(async  => {
    await app?.close;
  });

  it('ships ADR and docs',  => {
    expect(existsSync(join(root, 'docs/adr/0060-enterprise-language-registry.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/LANGUAGE_REGISTRY.md'))).toBe(true);
    expect(readFileSync(join(root, 'docs/LANGUAGE_REGISTRY.md'), 'utf8')).toContain('/v1/registry');
  });

  it('exposes registry overview with families, scripts, and rules', async  => {
    const res = await request(app.getHttpServer).get('/v1/registry').expect(200);
    expect(res.body.product).toMatch(/Language Registry/i);
    expect(res.body.counts.languages).toBeGreaterThan(20);
    expect(res.body.counts.families).toBeGreaterThan(3);
    expect(res.body.counts.writingSystems).toBeGreaterThan(5);
    expect(res.body.counts.linguisticRules).toBeGreaterThan(5);
    expect(res.body.counts.alphabets).toBeGreaterThan(0);
  });

  it('lists families, alphabets, and rules', async  => {
    const families = await request(app.getHttpServer).get('/v1/registry/families').expect(200);
    expect(families.body.data.some((f: { code: string }) => f.code === 'niger_congo')).toBe(true);

    const alphabets = await request(app.getHttpServer).get('/v1/registry/alphabets').expect(200);
    expect(alphabets.body.data.some((s: { code: string }) => s.code === 'Latn')).toBe(true);

    const rules = await request(app.getHttpServer)
      .get('/v1/registry/rules?kind=grammar&language=sw')
      .expect(200);
    expect(rules.body.data.length).toBeGreaterThan(0);
  });

  it('validates codes and reports health', async  => {
    const ok = await request(app.getHttpServer)
      .post('/v1/registry/validate')
      .send({ language: 'sw', script: 'Latn', family: 'niger_congo', bcp47: 'sw-TZ' })
      .expect(200);
    expect(ok.body.valid).toBe(true);

    const bad = await request(app.getHttpServer)
      .post('/v1/registry/validate')
      .send({ language: 'xx-not-real' })
      .expect(200);
    expect(bad.body.valid).toBe(false);

    const health = await request(app.getHttpServer).get('/v1/registry/health').expect(200);
    expect(health.body.status).toBe('ok');
  });

  it('returns language detail with family', async  => {
    const res = await request(app.getHttpServer).get('/v1/languages/sw').expect(200);
    expect(res.body.code).toBe('sw');
    expect(res.body.familyCode).toBe('niger_congo');
    expect(res.body.family?.nameEn).toMatch(/Niger/i);
  });

  it('exposes registry analytics', async  => {
    const res = await request(app.getHttpServer).get('/v1/registry/analytics').expect(200);
    expect(res.body.languagesByTier.length).toBeGreaterThan(0);
    expect(res.body.rulesByKind.length).toBeGreaterThan(0);
  });
});

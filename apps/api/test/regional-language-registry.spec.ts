import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { regionalCountsByRegion } from '../src/regional-language-registry/region-catalogs';

describe('Regional Language Registry', () => {
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

  it('exposes region tabs with Africa-first prominence', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/regional-language-registry/regions')
      .expect(200);
    expect(res.body.africaFirst).toBe(true);
    expect(res.body.regions[0].id).toBe('africa');
    const ids = res.body.regions.map((r: { id: string }) => r.id);
    expect(ids).toEqual(['africa', 'sea', 'mena', 'eu', 'uk', 'latam', 'na', 'global']);
    expect(res.body.counts.africa).toBeGreaterThan(100);
    expect(res.body.counts.sea).toBeGreaterThan(5);
    expect(res.body.counts.global).toBeGreaterThan(res.body.counts.africa);
  });

  it('lists SEA languages including Thai', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/regional-language-registry/languages?region=sea')
      .expect(200);
    expect(res.body.region).toBe('sea');
    expect(res.body.languages.some((l: { code: string }) => l.code === 'th')).toBe(true);
    expect(res.body.languages.some((l: { code: string }) => l.code === 'vi')).toBe(true);
  });

  it('keeps Twi on Africa tab and default demo pair in engine note', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/regional-language-registry/languages?region=africa')
      .expect(200);
    expect(res.body.languages.some((l: { code: string }) => l.code === 'ak')).toBe(true);
    const engine = await request(app.getHttpServer())
      .get('/v1/regional-language-registry/engine')
      .expect(200);
    expect(engine.body.note).toMatch(/English → Twi|English -> Twi|ak-GH/i);
    expect(engine.body.honesty.africaFirst).toBe(true);
  });

  it('catalog counts match helper', () => {
    const counts = regionalCountsByRegion();
    expect(counts.africa).toBeGreaterThan(100);
    expect(counts.mena).toBeGreaterThan(3);
    expect(counts.eu).toBeGreaterThan(10);
    expect(counts.uk).toBeGreaterThan(2);
    expect(counts.latam).toBeGreaterThan(3);
    expect(counts.na).toBeGreaterThan(3);
    expect(counts.sea).toBeGreaterThan(5);
    expect(counts.global).toBeGreaterThan(counts.africa);
  });
});

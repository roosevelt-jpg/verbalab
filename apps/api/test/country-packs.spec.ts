import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { COUNTRY_PACK_COUNT } from '../src/country-packs/country-pack-seeds';

describe('Country packs', () => {
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

  it('GET /v1/country-packs lists full ISO country packs', async () => {
    const res = await request(app.getHttpServer()).get('/v1/country-packs').expect(200);
    expect(COUNTRY_PACK_COUNT).toBeGreaterThanOrEqual(195);
    expect(res.body.data.length).toBeGreaterThanOrEqual(195);
    expect(res.body.total).toBe(COUNTRY_PACK_COUNT);
    expect(res.body.data.some((p: { code: string }) => p.code === 'KE')).toBe(true);
    expect(res.body.data.some((p: { code: string }) => p.code === 'US')).toBe(true);
    expect(res.body.data.some((p: { code: string }) => p.code === 'JP')).toBe(true);
    expect(res.body.note).toMatch(/Full ISO|Africa-first/i);
  });

  it('GET /v1/countries aliases country-packs and supports picker mode', async () => {
    const packs = await request(app.getHttpServer()).get('/v1/countries').expect(200);
    expect(packs.body.data.length).toBeGreaterThanOrEqual(195);

    const picker = await request(app.getHttpServer())
      .get('/v1/countries')
      .query({ picker: '1' })
      .expect(200);
    expect(picker.body.data.length).toBeGreaterThanOrEqual(195);
    expect(picker.body.data[0]).toHaveProperty('code');
    expect(picker.body.data[0]).toHaveProperty('nameEn');
    expect(picker.body.data[0]).toHaveProperty('region');
  });

  it('GET /v1/country-packs?region= filters (substring, case-insensitive)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/country-packs')
      .query({ region: 'East Africa' })
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((p: { region: string }) => /east africa/i.test(p.region))).toBe(
      true,
    );
    expect(res.body.data.some((p: { code: string }) => p.code === 'KE')).toBe(true);
  });

  it('lists Africa-first before non-African countries when unfiltered', async () => {
    const res = await request(app.getHttpServer()).get('/v1/country-packs').expect(200);
    const first = res.body.data[0] as { region: string };
    expect(first.region).toMatch(/Africa/i);
  });

  it('GET /v1/country-packs/:code?includeLocales=true composes locale packs', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/country-packs/KE')
      .query({ includeLocales: 'true' })
      .expect(200);
    expect(res.body.code).toBe('KE');
    expect(res.body.currencyCode).toBe('KES');
    expect(res.body.primaryLanguages).toEqual(expect.arrayContaining(['sw', 'en']));
    expect(Array.isArray(res.body.localePacks)).toBe(true);
    expect(res.body.localePacks.length).toBeGreaterThan(0);
  });

  it('Country Engine claims worldwide list without CLDR dialect completeness', async () => {
    const res = await request(app.getHttpServer()).get('/v1/country-packs/engine').expect(200);
    expect(res.body.honesty.worldwideCoverage).toBe(true);
    expect(res.body.honesty.cldrOs).toBe(false);
    expect(res.body.honesty.billingSkuCatalog).toBe(false);
    expect(res.body.note).not.toMatch(/not .* worldwide coverage claim/i);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'worldwide' && c.status === 'shipped',
      ),
    ).toBe(true);
  });
});

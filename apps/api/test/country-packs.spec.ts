import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

describe('Country packs',  => {
  let app: INestApplication<App>;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;
  });

  afterAll(async  => {
    await app.close;
  });

  it('GET /v1/country-packs lists curated packs', async  => {
    const res = await request(app.getHttpServer).get('/v1/country-packs').expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    expect(res.body.data.some((p: { code: string }) => p.code === 'KE')).toBe(true);
  });

  it('GET /v1/country-packs?region= filters', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/country-packs')
      .query({ region: 'East Africa' })
      .expect(200);
    expect(res.body.data.every((p: { region: string }) => p.region === 'East Africa')).toBe(true);
    expect(res.body.data.some((p: { code: string }) => p.code === 'KE')).toBe(true);
  });

  it('GET /v1/country-packs/:code?includeLocales=true composes locale packs', async  => {
    const res = await request(app.getHttpServer)
      .get('/v1/country-packs/KE')
      .query({ includeLocales: 'true' })
      .expect(200);
    expect(res.body.code).toBe('KE');
    expect(res.body.currencyCode).toBe('KES');
    expect(res.body.primaryLanguages).toEqual(expect.arrayContaining(['sw', 'en']));
    expect(Array.isArray(res.body.localePacks)).toBe(true);
    expect(res.body.localePacks.length).toBeGreaterThan(0);
  });
});

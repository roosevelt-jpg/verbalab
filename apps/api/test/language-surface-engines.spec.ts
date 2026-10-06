import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

describe('Language surface engines (country / language / models / dialect / locale)', () => {
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

  it('exposes Country Engine with honest deferred CLDR/SKU claims', async () => {
    const res = await request(app.getHttpServer()).get('/v1/country-packs/engine').expect(200);
    expect(res.body.product).toMatch(/Country/i);
    expect(res.body.honesty.cldrOs).toBe(false);
    expect(res.body.honesty.billingSkuCatalog).toBe(false);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'compose-locales' && c.status === 'shipped',
      ),
    ).toBe(true);
    expect(res.body.honesty.worldwideCoverage).toBe(true);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'worldwide' && c.status === 'shipped',
      ),
    ).toBe(true);
    expect(res.body.honesty.cldrOs).toBe(false);
  });

  it('exposes Language Engine and Language Cloud hub engine', async () => {
    const lang = await request(app.getHttpServer()).get('/v1/languages/engine').expect(200);
    expect(lang.body.product).toMatch(/Language Engine/i);
    expect(lang.body.honesty.ethnologueParity).toBe(false);

    const cloud = await request(app.getHttpServer()).get('/v1/language/engine').expect(200);
    expect(cloud.body.product).toMatch(/Language Cloud/i);
    expect(cloud.body.capabilities.length).toBeGreaterThan(5);
    expect(cloud.body.links.translateEngine).toBe('/v1/translate/engine');
  });

  it('exposes Models Engine publicly (not behind Clerk :idOrSlug)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/models/engine').expect(200);
    expect(res.body.product).toMatch(/Models Engine/i);
    expect(res.body.honesty.mlflowOs).toBe(false);
    expect(
      res.body.capabilities.some(
        (c: { id: string; status: string }) => c.id === 'live-matrix' && c.status === 'shipped',
      ),
    ).toBe(true);
  });

  it('exposes Dialect and Locale engines', async () => {
    const dialect = await request(app.getHttpServer()).get('/v1/dialects/engine').expect(200);
    expect(dialect.body.product).toMatch(/Dialect/i);
    expect(dialect.body.honesty.isAccentDetection).toBe(false);

    const locale = await request(app.getHttpServer()).get('/v1/locales/engine').expect(200);
    expect(locale.body.product).toMatch(/Locale/i);
    expect(locale.body.honesty.fullCldrParity).toBe(false);
  });

  it('aliases Language Intelligence engine and keeps Accent / Translate engines', async () => {
    const li = await request(app.getHttpServer()).get('/v1/language-intelligence/engine').expect(200);
    expect(li.body.product).toMatch(/Language Intelligence/i);

    const accent = await request(app.getHttpServer()).get('/v1/accents/engine').expect(200);
    expect(accent.body.product).toMatch(/Accent/i);

    const translate = await request(app.getHttpServer()).get('/v1/translate/engine').expect(200);
    expect(translate.body.product).toMatch(/Translate/i);
  });

  it('exposes engine catalogs via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{
          countryEngine { product }
          languageEngine { product }
          languageCloudEngine { product }
          dialectEngine { product }
          localeEngine { product }
          modelsEngine { product }
          accentEngine { product }
          translateEngine { product }
        }`,
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.countryEngine.product).toMatch(/Country/i);
    expect(res.body.data.languageEngine.product).toMatch(/Language Engine/i);
    expect(res.body.data.modelsEngine.product).toMatch(/Models/i);
    expect(res.body.data.accentEngine.product).toMatch(/Accent/i);
  });
});

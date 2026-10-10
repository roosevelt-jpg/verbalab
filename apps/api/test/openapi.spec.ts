import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { openApiDocument } from '../src/openapi/openapi.document';

describe('OpenAPI', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/openapi.json returns OpenAPI 3 document with translate path', async () => {
    const res = await request(app.getHttpServer()).get('/v1/openapi.json').expect(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).toContain('\n');
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.paths['/v1/translate']).toBeDefined();
    expect(res.body.paths['/v1/languages']).toBeDefined();
    expect(res.body.paths['/v1/jobs']).toBeDefined();
    expect(res.body.paths['/v1/audio/transcriptions']).toBeDefined();
    expect(res.body.paths['/v1/audio/speech']).toBeDefined();
    expect(res.body.paths['/v1/ocr']).toBeDefined();
    expect(res.body.info.title).toBe(openApiDocument.info.title);
    expect(res.body.paths['/v1/pilot-requests']?.post).toBeDefined();
    expect(res.body.paths['/v1/admin/voice-data/speakers']?.post).toBeDefined();
    expect(res.body.servers[0].url).toBe('https://api.lugemi.com');
    expect(res.body.tags.length).toBeGreaterThan(10);
  });

  it('GET /docs and /v1/docs serve interactive API docs UI', async () => {
    const resDocs = await request(app.getHttpServer()).get('/docs').expect(200);
    expect(resDocs.headers['content-type']).toMatch(/text\/html/);
    expect(resDocs.text).toContain('@scalar/api-reference');
    expect(resDocs.text).toContain('/v1/openapi.json');

    const resV1Docs = await request(app.getHttpServer()).get('/v1/docs').expect(200);
    expect(resV1Docs.headers['content-type']).toMatch(/text\/html/);
    expect(resV1Docs.text).toContain('@scalar/api-reference');

    const resSwagger = await request(app.getHttpServer()).get('/swagger').expect(200);
    expect(resSwagger.headers['content-type']).toMatch(/text\/html/);
    expect(resSwagger.text).toContain('swagger-ui');

    const resV1Swagger = await request(app.getHttpServer()).get('/v1/swagger').expect(200);
    expect(resV1Swagger.headers['content-type']).toMatch(/text\/html/);
    expect(resV1Swagger.text).toContain('swagger-ui');
  });
});

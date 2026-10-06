import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { openApiDocument } from '../src/openapi/openapi.document';

describe('OpenAPI',  => {
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

  it('GET /v1/openapi.json returns OpenAPI 3 document with translate path', async  => {
    const res = await request(app.getHttpServer).get('/v1/openapi.json').expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.paths['/v1/translate']).toBeDefined;
    expect(res.body.paths['/v1/languages']).toBeDefined;
    expect(res.body.paths['/v1/jobs']).toBeDefined;
    expect(res.body.paths['/v1/audio/transcriptions']).toBeDefined;
    expect(res.body.paths['/v1/audio/speech']).toBeDefined;
    expect(res.body.paths['/v1/ocr']).toBeDefined;
    expect(res.body.info.title).toBe(openApiDocument.info.title);
  });
});

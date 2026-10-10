import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { PLATFORM_CONNECTOR_REGISTRY } from '../src/connectors/platform-connectors.catalog';

describe('Platform connectors registry', () => {
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

  it('lists platform connectors including new high-value targets', async () => {
    const res = await request(app.getHttpServer()).get('/v1/connectors/platform').expect(200);
    expect(res.body.product).toBe('Lugemi Platform Connectors');
    expect(res.body.apis.translate.path).toBe('/v1/translate');
    expect(res.body.apis.tts.path).toBe('/v1/tts/synthesize');
    expect(res.body.apis.stt.path).toBe('/v1/speech/recognize');
    expect(res.body.apis.voiceClone.path).toBe('/v1/voice-clones');
    expect(res.body.apis.realtimeSegments.path).toBe('/v1/speech/stream');
    const ids = res.body.connectors.map((c: { id: string }) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['livekit', 'africas-talking', 'dhis2', 'unity']));
    expect(ids.length).toBe(PLATFORM_CONNECTOR_REGISTRY.length);
    expect(JSON.stringify(res.body)).not.toMatch(/ADR-\d+/);
  });

  it('returns integration guide with SDK snippets', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/connectors/platform/livekit')
      .expect(200);
    expect(res.body.id).toBe('livekit');
    expect(res.body.integrationGuide.length).toBeGreaterThan(40);
    expect(res.body.sdk.typescript).toContain('@lugemi/sdk');
    expect(res.body.sdk.python).toContain('from lugemi import Lugemi');
    expect(res.body.lugemiApis.length).toBeGreaterThan(0);
  });

  it('runs soft-sandbox demo hook', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/connectors/platform/africas-talking/demo')
      .send({ text: 'Hello', source: 'en', target: 'ak' })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.connectorId).toBe('africas-talking');
    expect(res.body.next.translate.path).toBe('/v1/translate');
    expect(res.body.next.realtime.path).toBe('/v1/speech/stream');
  });

  it('404s unknown connector', async () => {
    await request(app.getHttpServer()).get('/v1/connectors/platform/not-a-real-vendor').expect(404);
  });
});

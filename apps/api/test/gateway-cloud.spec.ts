import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { GatewayService } from '../src/gateway/gateway.service';
import { GatewayCloudService } from '../src/gateway-cloud/gateway-cloud.service';
import { ApiException } from '../src/common/errors/api-exception';
import { HttpStatus } from '@nestjs/common';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import type { ChatProvider } from '../src/gateway/chat-provider';

const root = join(__dirname, '../../..');

describe('AI Gateway Cloud Foundation', () => {
  let app: INestApplication<App>;
  let gateway: GatewayService;
  let gatewayCloud: GatewayCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    gateway = app.get(GatewayService);
    gatewayCloud = app.get(GatewayCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents AI Gateway Cloud mapping and closes Volume 1A', () => {
    const doc = join(root, 'docs/AI_GATEWAY_CLOUD.md');
    const adr = join(root, 'docs/adr/0050-ai-gateway-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Volume 1 Part A');
    expect(text).toContain('OpenRouter');
    expect(text).toContain('Deferred');
    expect(text).toContain('Deferred chat/speech');
    const adrText = readFileSync(adr, 'utf8');
    expect(adrText).toContain('Volume 1 Part A');
  });

  it('exposes public provider catalog with deferred vendors', async () => {
    const res = await request(app.getHttpServer()).get('/v1/gateway/providers').expect(200);
    expect(res.body.capabilities.streaming).toBe(false);
    expect(res.body.capabilities.caching.responseCache).toBe(false);
    const ids = res.body.providers.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining(['openai', 'openrouter', 'deferred_chat_a', 'deferred_speech_a']),
    );
    const deferredChat = res.body.providers.find((p: { id: string }) => p.id === 'deferred_chat_a');
    expect(deferredChat.status).toBe('deferred');
    const openrouter = res.body.providers.find((p: { id: string }) => p.id === 'openrouter');
    expect(openrouter.status).toBe('optional');
  });

  it('falls back from primary chat to OpenRouter-compatible provider', async () => {
    const primary: ChatProvider = {
      name: 'fixture_primary',
      async complete() {
        throw new ApiException('provider_error', 'primary down', HttpStatus.BAD_GATEWAY);
      },
    };
    const fallback: ChatProvider = {
      name: 'fixture_fallback',
      async complete() {
        return {
          message: { role: 'assistant', content: 'fallback ok' },
          model: 'fixture',
          provider: 'fixture_fallback',
          promptTokens: 1,
          completionTokens: 1,
          totalTokens: 2,
          latencyMs: 1,
        };
      },
    };
    gateway.setChatProviderForTests(primary);
    gateway.setChatFallbackForTests(fallback);

    const out = await gateway.chat({
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(out.provider).toBe('fixture_fallback');
    expect(out.message.content).toBe('fallback ok');
  });

  it('returns gateway overview volume closeout', async () => {
    const overview = await gatewayCloud.overview();
    expect(overview.health.status).toBe('ok');
    expect(overview.volume.closes).toBe('Volume 1 Part A');
    expect(overview.providers.length).toBeGreaterThan(5);
    expect(overview.liveModels).toBeTruthy();
  });
});

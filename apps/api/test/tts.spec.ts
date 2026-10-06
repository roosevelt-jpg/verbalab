import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { UsageService } from '../src/usage/usage.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { OpenAiTtsAdapter } from '../src/gateway/openai-tts.adapter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_tts_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Text-to-speech (VL-042)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let usage: UsageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    usage = app.get(UsageService);

    app.get(GatewayService).setTtsProviderForTests({
      name: 'fixture',
      listVoices() {
        return [
          {
            id: 'alloy',
            name: 'Alloy',
            gender: 'neutral',
            languages: ['en'],
            provider: 'fixture',
          },
        ];
      },
      async synthesize(input) {
        return {
          audio: Buffer.from(`AUDIO:${input.text}`),
          mimeType: 'audio/mpeg',
          format: 'mp3',
          voice: input.voice,
          characters: [...input.text].length,
          provider: 'fixture',
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists voices without auth', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audio/voices').expect(200);
    expect(res.body.data.some((v: { id: string }) => v.id === 'alloy')).toBe(true);
  });

  it('synthesizes speech audio and meters TTS characters', async () => {
    const org = await seedOrg(prisma, 'tts');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'tts-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/audio/speech')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hello', voice: 'alloy' })
      .expect(200);

    expect(res.headers['content-type']).toContain('audio/mpeg');
    expect(res.headers['x-lugemi-provider']).toBe('fixture');
    expect(res.headers['x-lugemi-voice']).toBe('alloy');
    expect(res.headers['x-lugemi-characters']).toBe('5');
    expect(Buffer.from(res.body).toString('utf8')).toBe('AUDIO:Hello');

    const summary = await usage.summary(org.id);
    expect(summary.tts.requests).toBe(1);
    expect(summary.tts.characters).toBe(5);
  });

  it('rejects missing voice/text', async () => {
    const org = await seedOrg(prisma, 'badtts');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'bad-tts',
    });

    await request(app.getHttpServer())
      .post('/v1/audio/speech')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hi' })
      .expect(400);
  });

  it('OpenAI TTS adapter reports not configured without key', async () => {
    const adapter = new OpenAiTtsAdapter('');
    await expect(
      adapter.synthesize({ text: 'Hi', voice: 'alloy' }),
    ).rejects.toMatchObject({ code: 'provider_not_configured' });
  });
});

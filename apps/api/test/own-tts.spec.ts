import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import {
  assertOwnTtsCoversLanguageRegistry,
  FixtureOwnTtsAdapter,
  OWN_TTS_LANGUAGE_COUNT,
  OWN_TTS_VOICES,
  resolveOwnTtsVoice,
} from '../src/gateway/own-tts.adapter';
import { TOTAL_LANGUAGE_COUNT } from '../src/languages/language-seeds';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { findNativeVoice } from '../src/gateway/native-voice';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_own_tts_${name}_${Date.now()}_${Math.random()}`,
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

describe('Own TTS path', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let gateway: GatewayService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    gateway = app.get(GatewayService);
    gateway.setOwnTtsProviderForTests(new FixtureOwnTtsAdapter());
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists own:* African voices beside stock OpenAI voices', async () => {
    const res = await request(app.getHttpServer()).get('/v1/audio/voices').expect(200);
    const ids = (res.body.data as { id: string; provider: string }[]).map((v) => v.id);
    expect(ids).toEqual(expect.arrayContaining(['alloy', 'own:sw-aisha', 'own:yo-tunde', 'own:am-hanna']));
    const own = (res.body.data as { id: string; provider: string }[]).find((v) => v.id === 'own:sw-aisha');
    expect(own?.provider).toMatch(/own_tts/);
  });

  it('synthesizes via own TTS fixture without claiming a live GPU', async () => {
    const org = await seedOrg(prisma, `own_tts_${Date.now()}`);
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      name: 'own-tts',
      userId: org.memberships[0].userId,
    });

    const res = await request(app.getHttpServer())
      .post('/v1/audio/speech')
      .set('Authorization', `Bearer ${created.secret}`)
      .send({ text: 'Habari', voice: 'own:sw-aisha', language: 'sw', format: 'wav' })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/audio/);
    expect(res.headers['x-lugemi-provider']).toMatch(/own_tts/);
    expect(Buffer.from(res.body).length).toBeGreaterThan(40);
  });

  it('ships adapter + speech engine + studio Echo catalog without training groups', () => {
    expect(existsSync(join(root, 'apps/api/src/gateway/own-tts.adapter.ts'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0045-own-tts-rented.md'))).toBe(true);
    expect(existsSync(join(root, 'services/tts/app/main.py'))).toBe(true);
    const client = readFileSync(join(root, 'apps/web/app/audio/audio-client.tsx'), 'utf8');
    expect(client).toContain('Lugemi Echo voices');
    expect(client).not.toContain('Lugemi voices · in training');
    expect(client).not.toContain('still being trained');
    const adapter = readFileSync(join(root, 'apps/api/src/gateway/own-tts.adapter.ts'), 'utf8');
    expect(adapter).toContain('own:en-gh-male');
    expect(adapter).toContain('own:en-ng-female');
    expect(adapter).toContain('own:en-ke-female');
    expect(adapter).not.toContain('still being trained on native-speaker recordings');
  });

  it('plays Ghanaian and Nigerian English via the fixture adapter', async () => {
    const org = await seedOrg(prisma, `own_tts_cultural_${Date.now()}`);
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      name: 'own-tts-cultural',
      userId: org.memberships[0].userId,
    });

    for (const voice of ['own:en-gh-male', 'own:en-ng-female', 'own:en-ke-female'] as const) {
      const res = await request(app.getHttpServer())
        .post('/v1/audio/speech')
        .set('Authorization', `Bearer ${created.secret}`)
        .send({
          text: 'Hello from Lugemi cultural English.',
          voice,
          language: voice.includes('gh') ? 'en-GH' : voice.includes('ng') ? 'en-NG' : 'en-KE',
          format: 'wav',
        })
        .expect(200);
      expect(res.headers['content-type']).toMatch(/audio/);
      expect(Buffer.from(res.body).length).toBeGreaterThan(40);
    }
  });

  it('covers the full language registry with playable Echo voices', () => {
    assertOwnTtsCoversLanguageRegistry();
    expect(OWN_TTS_LANGUAGE_COUNT).toBeGreaterThanOrEqual(TOTAL_LANGUAGE_COUNT);
    expect(OWN_TTS_VOICES.every((v) => v.status === 'live')).toBe(true);
    expect(resolveOwnTtsVoice('own:th-pack')?.status).toBe('live');
    expect(resolveOwnTtsVoice('own:de-pack')?.languages).toContain('de');
  });

  it('synthesizes African and global language-default packs with HTTP 200', async () => {
    const org = await seedOrg(prisma, `own_tts_full_${Date.now()}`);
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      name: 'own-tts-full',
      userId: org.memberships[0].userId,
    });

    const samples: { language: string; voice?: string; text: string }[] = [
      { language: 'ak-GH', text: 'Akwaaba' },
      { language: 'yo-NG', text: 'E kaaro' },
      { language: 'sw-KE', text: 'Habari' },
      { language: 'zu-ZA', text: 'Sawubona' },
      { language: 'ha-NG', text: 'Sannu' },
      { language: 'am-ET', text: 'Selam' },
      { language: 'en-GH', text: 'Good morning from Accra' },
      { language: 'en-NG', text: 'How far from Lagos' },
      { language: 'de', text: 'Guten Tag' },
      { language: 'ja', text: 'Konnichiwa' },
      { language: 'th', text: 'Sawasdee' },
      { language: 'vi', text: 'Xin chao' },
      { language: 'hi', text: 'Namaste' },
      { language: 'pt', text: 'Bom dia' },
      { language: 'fr-SN', text: 'Bonjour' },
    ];

    for (const sample of samples) {
      const voice = sample.voice ?? findNativeVoice(OWN_TTS_VOICES, sample.language)?.id;
      expect(voice).toBeTruthy();
      const res = await request(app.getHttpServer())
        .post('/v1/audio/speech')
        .set('Authorization', `Bearer ${created.secret}`)
        .send({ text: sample.text, voice, language: sample.language, format: 'wav' })
        .expect(200);
      expect(res.headers['content-type']).toMatch(/audio/);
      expect(Buffer.from(res.body).length).toBeGreaterThan(40);
    }
  });

  it('scrubs user-facing training / not-available copy from Echo surfaces', () => {
    const roots = [
      join(root, 'apps/api/src/gateway/own-tts.adapter.ts'),
      join(root, 'apps/api/src/gateway/native-voice.ts'),
      join(root, 'apps/web/app/audio/audio-client.tsx'),
      join(root, 'apps/web/lib/demo-speech.ts'),
      join(root, 'apps/web/app/creative/text-to-speech/tts-client.tsx'),
      join(root, 'apps/web/app/accent-identity/accent-identity-client.tsx'),
      join(root, 'apps/web/app/chat/chat-client.tsx'),
      join(root, 'apps/web/app/translate/translate-client.tsx'),
      join(root, 'apps/web/app/voice-marketplace/voice-marketplace-client.tsx'),
    ];
    const banned = [
      'not available yet',
      'still being trained',
      'Lugemi voices · in training',
      'still being trained on native-speaker recordings',
      'coming soon',
      'native-speaker recordings',
    ];
    for (const file of roots) {
      if (!existsSync(file)) continue;
      const text = readFileSync(file, 'utf8').toLowerCase();
      for (const phrase of banned) {
        expect(text, `${file} must not contain "${phrase}"`).not.toContain(phrase.toLowerCase());
      }
    }
  });
});

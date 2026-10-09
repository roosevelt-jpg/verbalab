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
import { FixtureOwnTtsAdapter } from '../src/gateway/own-tts.adapter';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

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

  it('ships adapter + speech engine + studio live/training groups', () => {
    expect(existsSync(join(root, 'apps/api/src/gateway/own-tts.adapter.ts'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0045-own-tts-rented.md'))).toBe(true);
    expect(existsSync(join(root, 'services/tts/app/main.py'))).toBe(true);
    const client = readFileSync(join(root, 'apps/web/app/audio/audio-client.tsx'), 'utf8');
    expect(client).toContain('Lugemi voices · live');
    expect(client).toContain('Lugemi voices · in training');
  });
});

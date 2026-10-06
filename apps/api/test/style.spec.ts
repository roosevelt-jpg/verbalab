import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_style_${name}_${Date.now()}_${Math.random()}`,
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

describe('Writing Style AI', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let prevOpenAi: string | undefined;

  beforeAll(async () => {
    prevOpenAi = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setDetectProviderForTests({
      name: 'fixture_detect',
      async detect() {
        return { language: 'en', confidence: 0.95, provider: 'fixture_detect' };
      },
    });
  });

  afterAll(async () => {
    if (prevOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevOpenAi;
    await app.close();
  });

  it('GET /v1/style/profiles lists bounded profiles', async () => {
    const res = await request(app.getHttpServer()).get('/v1/style/profiles').expect(200);
    const ids = res.body.data.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining(['professional', 'casual', 'concise', 'academic', 'plain']),
    );
  });

  it('POST /v1/style/rewrite applies professional rules', async () => {
    const org = await seedOrg(prisma, 'style');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'style-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/style/rewrite')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: "I'm gonna finish this, yeah?", profile: 'professional', language: 'en' })
      .expect(200);

    expect(res.body.provider).toBe('rules');
    expect(res.body.changed).toBe(true);
    expect(res.body.rewritten).toMatch(/I am/);
    expect(res.body.rewritten).toMatch(/going to/);
  });
});

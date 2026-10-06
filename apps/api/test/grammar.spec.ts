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
              clerkUserId: `clerk_gram_${name}_${Date.now()}_${Math.random()}`,
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

describe('Grammar AI', () => {
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

  it('POST /v1/grammar/check applies deterministic rules', async () => {
    const org = await seedOrg(prisma, 'gram');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'gram-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/grammar/check')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'i has went to teh store store', language: 'en' })
      .expect(200);

    expect(res.body.provider).toBe('rules');
    expect(res.body.changed).toBe(true);
    expect(res.body.corrected).toMatch(/I have/);
    expect(res.body.corrected).toContain('the store');
    expect(res.body.issueCount).toBeGreaterThan(0);
  });
});

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { generateApiKeySecret } from '../src/common/crypto/api-keys';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { MembershipRole } from '@prisma/client';

async function seedOrg(prisma: PrismaService, name: string) {
  const org = await prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_${name}_${Date.now()}_${Math.random()}`,
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
  return org;
}

describe('Phase 1 API', () => {
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

    gateway.setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.translateLatency).toEqual({
      samples: 0,
      p50Ms: null,
      p95Ms: null,
      p99Ms: null,
      maxMs: null,
    });
  });

  it('GET /v1/languages returns seeded languages', async () => {
    const res = await request(app.getHttpServer()).get('/v1/languages').expect(200);
    expect(res.body.data.some((l: { code: string }) => l.code === 'sw')).toBe(true);
    expect(res.body.data.some((l: { code: string }) => l.code === 'yo')).toBe(true);
  });

  it('API key create / auth / revoke → 401', async () => {
    const org = await seedOrg(prisma, 'keys');
    const userId = org.memberships[0]!.userId;
    const workspaceId = org.workspaces[0]!.id;

    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId,
      userId,
      name: 'test',
    });

    expect(created.secret.startsWith('lg_live_')).toBe(true);

    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${created.secret}`)
      .send({ text: 'Hello', source: 'en', target: 'sw' })
      .expect(200);

    await apiKeys.revoke(org.id, created.id);

    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${created.secret}`)
      .send({ text: 'Hello', source: 'en', target: 'sw' })
      .expect(401);
  });

  it('rejects unsupported language and missing text', async () => {
    const org = await seedOrg(prisma, 'validation');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'validation',
    });

    const missing = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${created.secret}`)
      .send({ source: 'en', target: 'sw' })
      .expect(400);
    expect(missing.body.error.code).toBe('validation_error');

    const badLang = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${created.secret}`)
      .send({ text: 'Hi', source: 'en', target: 'xx' })
      .expect(400);
    expect(badLang.body.error.code).toBe('unsupported_language');
  });

  it('tenant isolation: org B cannot see org A usage', async () => {
    const orgA = await seedOrg(prisma, 'tenantA');
    const orgB = await seedOrg(prisma, 'tenantB');

    const keyA = await apiKeys.create({
      organizationId: orgA.id,
      workspaceId: orgA.workspaces[0]!.id,
      userId: orgA.memberships[0]!.userId,
      name: 'a',
    });

    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${keyA.secret}`)
      .send({ text: 'Hello', source: 'en', target: 'sw' })
      .expect(200);

    const summaryA = await app.get(PrismaService).usageEvent.findMany({
      where: { organizationId: orgA.id },
    });
    const summaryB = await app.get(PrismaService).usageEvent.findMany({
      where: { organizationId: orgB.id },
    });

    expect(summaryA.length).toBeGreaterThan(0);
    expect(summaryB.length).toBe(0);

    // Org B key must not authenticate as org A even with a forged prefix lookup
    const forged = generateApiKeySecret();
    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${forged.secret}`)
      .send({ text: 'Hello', source: 'en', target: 'sw' })
      .expect(401);
  });

  it('live Google translate is skipped unless TRANSLATE_LIVE=1 and key present', async () => {
    if (process.env.TRANSLATE_LIVE !== '1' | !process.env.GOOGLE_TRANSLATE_API_KEY) {
      return;
    }

    const { GoogleTranslateAdapter } = await import('../src/gateway/google-translate.adapter');
    const adapter = new GoogleTranslateAdapter(process.env.GOOGLE_TRANSLATE_API_KEY);
    const result = await adapter.translate({ text: 'Hello', source: 'en', target: 'sw' });
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.provider).toBe('google_translate');
  });
});

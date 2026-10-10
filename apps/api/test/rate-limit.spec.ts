import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { MembershipRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { RateLimitService } from '../src/rate-limit/rate-limit.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      plan: 'free',
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_rl_${name}_${Date.now()}_${Math.random()}`,
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

describe('Rate limits', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rateLimits: RateLimitService;
  const prevKey = process.env.RATE_LIMIT_FREE_PER_KEY;
  const prevOrg = process.env.RATE_LIMIT_FREE_PER_ORG;

  beforeAll(async () => {
    process.env.RATE_LIMIT_FREE_PER_KEY = '2';
    process.env.RATE_LIMIT_FREE_PER_ORG = '10';
    process.env.RATE_LIMIT_MEMORY = '1';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
    rateLimits = app.get(RateLimitService);
    rateLimits.resetForTests();

    app.get(GatewayService).setProviderForTests({
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
    if (prevKey === undefined) delete process.env.RATE_LIMIT_FREE_PER_KEY;
    else process.env.RATE_LIMIT_FREE_PER_KEY = prevKey;
    if (prevOrg === undefined) delete process.env.RATE_LIMIT_FREE_PER_ORG;
    else process.env.RATE_LIMIT_FREE_PER_ORG = prevOrg;
    delete process.env.RATE_LIMIT_MEMORY;
    await app.close();
  });

  beforeEach(() => {
    rateLimits.resetForTests();
  });

  it('allows requests under the key limit and returns rate limit headers', async () => {
    const org = await seedOrg(prisma, 'rlok');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'rl-key',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hi', source: 'en', target: 'sw' })
      .expect(200);

    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  it('returns 429 with Retry-After when per-key limit is exceeded', async () => {
    const org = await seedOrg(prisma, 'rl429');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'rl-burst',
    });

    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'One', source: 'en', target: 'sw' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Two', source: 'en', target: 'sw' })
      .expect(200);

    const blocked = await request(app.getHttpServer())
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Three', source: 'en', target: 'sw' })
      .expect(429);

    expect(blocked.body.error.code).toBe('rate_limited');
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });
});

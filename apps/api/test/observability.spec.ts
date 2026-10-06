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
              clerkUserId: `clerk_obs_${name}_${Date.now}_${Math.random}`,
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

describe('Observability',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setProviderForTests({
      name: 'fixture',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture',
          characters: [...input.text].length,
          latencyMs: 42,
        };
      },
    });
  });

  afterAll(async  => {
    await app.close;
  });

  it('echoes x-request-id on responses', async  => {
    const res = await request(app.getHttpServer)
      .get('/health')
      .set('x-request-id', 'req-test-123')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('req-test-123');
  });

  it('records translate latency and exposes p95 metrics', async  => {
    const org = await seedOrg(prisma, 'obs');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'obs-key',
    });

    await request(app.getHttpServer)
      .post('/v1/translate')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ text: 'Hello', source: 'en', target: 'sw' })
      .expect(200);

    const metrics = await request(app.getHttpServer).get('/v1/metrics/translate').expect(200);
    expect(metrics.body.feature).toBe('translate');
    expect(metrics.body.samples).toBeGreaterThanOrEqual(1);
    expect(metrics.body.p95Ms).toBeGreaterThanOrEqual(0);

    const health = await request(app.getHttpServer).get('/health').expect(200);
    expect(health.body.translateLatency.samples).toBeGreaterThanOrEqual(1);
  });
});

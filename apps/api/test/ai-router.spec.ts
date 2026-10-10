import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
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
              clerkUserId: `clerk_ar_${name}_${Date.now()}_${Math.random()}`,
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

describe('AI Router', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_AI_ROUTER_MODE;

  beforeAll(async () => {
    process.env.LUGEMI_AI_ROUTER_MODE = 'sandbox';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_AI_ROUTER_MODE;
    else process.env.LUGEMI_AI_ROUTER_MODE = prevMode;
    await app.close();
  });

  it('documents AI Router honesty', () => {
    const doc = join(root, 'docs/AI_ROUTER.md');
    const adr = join(root, 'docs/adr/0118-ai-router.md');
    const readme = join(root, 'docs/roadmap/volume7-inference-cloud/README_VOLUME7.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/service mesh|mesh/i);
    expect(text).toMatch(/does \*\*not\*\*|not a service mesh/i);
    expect(text).toMatch(/org\/workspace|workspace-scoped/i);
    expect(text).toMatch(/Gateway/i);
    expect(text).toMatch(/spend|Cost Optimization/i);
  });

  it('exposes engine with honesty + features', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-router/engine').expect(200);
    expect(res.body.product).toContain('AI Router');
    expect(res.body.honesty.serviceMeshOs).toBe(false);
    expect(res.body.honesty.multiCloudRouterOs).toBe(false);
    expect(res.body.honesty.regeneratesAiGateway).toBe(false);
    expect(res.body.honesty.extendsAiGateway).toBe(true);
    expect(res.body.honesty.dryRunResolveOnly).toBe(true);
    expect(res.body.honesty.enforcesSpendCaps).toBe(false);
    expect(res.body.spendSafety.enforcesSpendCaps).toBe(true);
    expect(res.body.honesty.primaryRegion).toBe('af-south-1');
    expect(res.body.mode).toBe('sandbox');
    expect(res.body.capabilities.some((c: { id: string }) => c.id === 'caching')).toBe(true);
    expect(
      res.body.capabilities.find((c: { id: string }) => c.id === 'caching').status,
    ).toBe('shipped');

    const features = await request(app.getHttpServer()).get('/v1/ai-router/features').expect(200);
    expect(features.body.features.some((f: { feature: string }) => f.feature === 'chat')).toBe(
      true,
    );
  });

  it('upserts policy and resolves cost vs latency routes', async () => {
    const org = await seedOrg(prisma, `ar_${Date.now()}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      userId: org.memberships[0].userId,
      name: 'ar-test',
    });

    await request(app.getHttpServer())
      .put('/v1/ai-router/policies')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ optimize: 'balanced', maxRetries: 2, preferRegion: 'af-south-1' })
      .expect(200);

    const detect = await request(app.getHttpServer())
      .post('/v1/ai-router/resolve')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ feature: 'detect', optimize: 'latency', preferConfiguredOnly: false })
      .expect(200);
    expect(detect.body.dryRun).toBe(true);
    expect(detect.body.selected.providerId).toBe('lugemi_lid');
    expect(detect.body.chain.length).toBeGreaterThanOrEqual(1);
    expect(detect.body.honesty.serviceMeshOs).toBe(false);
    expect(detect.body.caching.enabled).toBe(false);

    const costChat = await request(app.getHttpServer())
      .post('/v1/ai-router/resolve')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        feature: 'chat',
        optimize: 'cost',
        allowFallback: true,
      })
      .expect(200);
    // Lugemi Atlas is primary and always configured (cost 0); legacy adapters are silent fallbacks
    expect(['lugemi_atlas', 'legacy_chat', 'legacy_chat_alt']).toContain(
      costChat.body.selected.providerId,
    );
    expect(costChat.body.spendSafety?.enforcesSpendCaps ?? false).toBe(false);
    expect(costChat.body.honesty.enforcesSpendCaps).toBe(false);

    const decisions = await request(app.getHttpServer())
      .get('/v1/ai-router/decisions')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(decisions.body.decisions.length).toBeGreaterThanOrEqual(2);

    const mon = await request(app.getHttpServer())
      .get('/v1/ai-router/monitoring')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(mon.body.honesty.extendsAiGateway).toBe(true);
    expect(mon.body.deferred).not.toContain('caching');
  });

  it('exposes aiRouterEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ aiRouterEngine { product serviceMeshOs multiCloudRouterOs regeneratesAiGateway extendsAiGateway dryRunResolveOnly enforcesSpendCaps orgWorkspaceScoped primaryRegion mode capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.aiRouterEngine.serviceMeshOs).toBe(false);
    expect(res.body.data.aiRouterEngine.multiCloudRouterOs).toBe(false);
    expect(res.body.data.aiRouterEngine.regeneratesAiGateway).toBe(false);
    expect(res.body.data.aiRouterEngine.extendsAiGateway).toBe(true);
    expect(res.body.data.aiRouterEngine.dryRunResolveOnly).toBe(true);
    expect(res.body.data.aiRouterEngine.enforcesSpendCaps).toBe(false);
    expect(res.body.data.aiRouterEngine.primaryRegion).toBe('af-south-1');
  });
});

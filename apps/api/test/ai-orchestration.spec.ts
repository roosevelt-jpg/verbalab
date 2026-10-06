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
import { GatewayService } from '../src/gateway/gateway.service';
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
              clerkUserId: `clerk_orch_${name}_${Date.now()}_${Math.random()}`,
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

describe('AI Orchestration', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    const gateway = app.get(GatewayService);
    gateway.setDetectProviderForTests({
      name: 'fixture_detect',
      async detect() {
        return { language: 'en', confidence: 0.99, provider: 'fixture_detect' };
      },
    });
    gateway.setProviderForTests({
      name: 'fixture_mt',
      async translate(input) {
        return {
          text: `[${input.target}] ${input.text}`,
          source: input.source,
          target: input.target,
          provider: 'fixture_mt',
          characters: [...input.text].length,
          latencyMs: 1,
        };
      },
    });
    gateway.setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const user = [...input.messages].reverse().find((m) => m.role === 'user');
        return {
          message: {
            role: 'assistant',
            content: `Answer: orchestrated reply for ${user?.content.slice(0, 48) ?? 'prompt'}`,
          },
          model: input.model ?? 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 12,
          completionTokens: 8,
          totalTokens: 20,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents AI Orchestration honesty', () => {
    const doc = join(root, 'docs/AI_ORCHESTRATION.md');
    const adr = join(root, 'docs/adr/0101-ai-orchestration.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/not.*multi-cloud agent/i);
    expect(text).toContain('');
  });

  it('exposes engine with multiCloudAgentOs=false', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/ai-orchestration/engine')
      .expect(200);
    expect(res.body.product).toContain('Orchestration');
    expect(res.body.honesty.multiCloudAgentOs).toBe(false);
    expect(res.body.honesty.langGraphOs).toBe(false);
    expect(res.body.honesty.loadBearingE2e).toBe(true);
    expect(res.body.honesty.executesRealRequests).toBe(true);

    const pipelines = await request(app.getHttpServer())
      .get('/v1/ai-orchestration/pipelines')
      .expect(200);
    expect(pipelines.body.pipelines.some((p: { id: string }) => p.id === 'detect_translate')).toBe(
      true,
    );
  });

  it('runs detect_translate and decide_act e2e pipelines', async () => {
    const org = await seedOrg(prisma, 'orch');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'orch-key',
    });

    const detectTranslate = await request(app.getHttpServer())
      .post('/v1/ai-orchestration/run')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        pipeline: 'detect_translate',
        text: 'Hello orchestration',
        target: 'sw',
      })
      .expect(200);

    expect(detectTranslate.body.pipeline).toBe('detect_translate');
    expect(detectTranslate.body.steps.length).toBe(2);
    expect(detectTranslate.body.steps[0].op).toBe('detect');
    expect(detectTranslate.body.steps[1].op).toBe('translate');
    expect(detectTranslate.body.result).toMatch(/\[sw\]/);
    expect(detectTranslate.body.honesty.multiCloudAgentOs).toBe(false);

    const decideAct = await request(app.getHttpServer())
      .post('/v1/ai-orchestration/run')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        pipeline: 'decide_act',
        text: 'translate this FAQ please',
        target: 'sw',
      })
      .expect(200);
    expect(decideAct.body.pipeline).toBe('decide_act');
    expect(decideAct.body.steps.length).toBeGreaterThanOrEqual(2);
    expect(decideAct.body.steps[0].op).toBe('decide');

    const multiCloud = await request(app.getHttpServer())
      .post('/v1/ai-orchestration/run')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ pipeline: 'multi_cloud', text: 'hello' });
    expect(multiCloud.status).toBe(400);

    const analytics = await request(app.getHttpServer())
      .get('/v1/ai-orchestration/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.runs).toBeGreaterThanOrEqual(2);
  });

  it('exposes aiOrchestration via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ aiOrchestration { product multiCloudAgentOs langGraphOs loadBearingE2e capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.aiOrchestration.multiCloudAgentOs).toBe(false);
    expect(res.body.data.aiOrchestration.loadBearingE2e).toBe(true);
  });
});

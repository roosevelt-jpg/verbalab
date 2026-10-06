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
              clerkUserId: `clerk_rc_${name}_${Date.now()}_${Math.random()}`,
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

describe('Reasoning Cloud', () => {
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

    app.get(GatewayService).setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const user = [...input.messages].reverse().find((m) => m.role === 'user');
        const content = [
          '1. Clarify the ask.',
          '2. Weigh options briefly.',
          `Answer: reasoned reply for ${user?.content.slice(0, 40) ?? 'problem'}`,
        ].join('\n');
        return {
          message: { role: 'assistant', content },
          model: input.model ?? 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 20,
          completionTokens: 15,
          totalTokens: 35,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Reasoning Cloud honesty', () => {
    const doc = join(root, 'docs/REASONING_CLOUD.md');
    const adr = join(root, 'docs/adr/0097-reasoning-cloud.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/not a custom reasoner/i);
    expect(text).toContain('');
  });

  it('exposes engine with customReasonerKernel=false', async () => {
    const res = await request(app.getHttpServer()).get('/v1/reasoning-cloud/engine').expect(200);
    expect(res.body.product).toContain('Reasoning Cloud');
    expect(res.body.honesty.customReasonerKernel).toBe(false);
    expect(res.body.honesty.symbolicReasonerOs).toBe(false);
    expect(res.body.honesty.llmGateway).toBe(true);
    expect(res.body.honesty.toolExecution).toBe(false);
    const tot = res.body.capabilities.find((c: { id: string }) => c.id === 'tree-of-thought');
    expect(tot.status).toBe('partial');

    const strategies = await request(app.getHttpServer())
      .get('/v1/reasoning-cloud/strategies')
      .expect(200);
    expect(strategies.body.strategies.some((s: { id: string }) => s.id === 'chain_of_thought')).toBe(
      true,
    );
  });

  it('reasons with chain_of_thought and tool_selection without executing tools', async () => {
    const org = await seedOrg(prisma, 'rc');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'rc-key',
    });

    const reasoned = await request(app.getHttpServer())
      .post('/v1/reasoning-cloud/reason')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        problem: 'Should we prioritize Swahili FAQ translation?',
        strategy: 'chain_of_thought',
        retrieve: false,
      })
      .expect(200);

    expect(reasoned.body.strategy).toBe('chain_of_thought');
    expect(reasoned.body.provider).toBe('fixture_chat');
    expect(reasoned.body.steps.length).toBeGreaterThanOrEqual(1);
    expect(reasoned.body.answer).toMatch(/Answer:/i);
    expect(reasoned.body.honesty.customReasonerKernel).toBe(false);
    expect(reasoned.body.usage.calls).toBe(1);

    const tools = await request(app.getHttpServer())
      .post('/v1/reasoning-cloud/reason')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        problem: 'Pick a tool to translate FAQ copy',
        strategy: 'tool_selection',
        retrieve: false,
      })
      .expect(200);
    expect(tools.body.strategy).toBe('tool_selection');
    expect(tools.body.honesty.toolExecution).toBe(false);

    const bad = await request(app.getHttpServer())
      .post('/v1/reasoning-cloud/reason')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ problem: ' ', retrieve: false });
    expect(bad.status).toBe(400);

    const analytics = await request(app.getHttpServer())
      .get('/v1/reasoning-cloud/analytics')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(analytics.body.reasonRequests).toBeGreaterThanOrEqual(2);
  });

  it('exposes reasoningCloudEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ reasoningCloudEngine { product customReasonerKernel symbolicReasonerOs llmGateway capabilities { id status } } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.reasoningCloudEngine.customReasonerKernel).toBe(false);
    expect(res.body.data.reasoningCloudEngine.llmGateway).toBe(true);
  });
});

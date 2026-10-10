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
              clerkUserId: `clerk_rr_${name}_${Date.now()}_${Math.random()}`,
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

describe('Reasoning Runtime', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_REASONING_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.LUGEMI_REASONING_RUNTIME_MODE = 'sandbox';

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
          'Selected tools: chat, translate',
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
    if (prevMode === undefined) delete process.env.LUGEMI_REASONING_RUNTIME_MODE;
    else process.env.LUGEMI_REASONING_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Reasoning Runtime honesty (extends Reasoning Cloud; no custom kernel)', () => {
    const doc = join(root, 'docs/REASONING_RUNTIME.md');
    const adr = join(root, 'docs/adr/0129-reasoning-runtime.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/custom reasoner/i);
    expect(text).toMatch(/Reasoning Cloud/i);
    expect(text).toMatch(/tool.?execut/i);
  });

  it('exposes engine with honest flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/reasoning-runtime/engine').expect(200);
    expect(res.body.product).toContain('Reasoning Runtime');
    expect(res.body.honesty.customReasonerKernel).toBe(false);
    expect(res.body.honesty.toolExecution).toBe(false);
    expect(res.body.honesty.regeneratesReasoningCloud).toBe(false);
    expect(res.body.honesty.extendsReasoningCloud).toBe(true);
    expect(res.body.honesty.storesHistoryInMemoryCloud).toBe(true);
    expect(res.body.links.console).toBe('/reasoning-runtime');
  });

  it('plans, reasons, evaluates, histories, and never claims tool execution', async () => {
    const org = await seedOrg(prisma, 'rr');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'rr-key',
    });

    const planned = await request(app.getHttpServer())
      .post('/v1/reasoning-runtime/plan')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ problem: 'Translate a FAQ and check quality', sandboxOnly: true })
      .expect(200);
    expect(planned.body.strategy).toBe('planning');
    expect(planned.body.steps.length).toBeGreaterThan(2);
    expect(planned.body.historyId).toBeTruthy();
    expect(planned.body.honesty.customReasonerKernel).toBe(false);

    const reasoned = await request(app.getHttpServer())
      .post('/v1/reasoning-runtime/reason')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        problem: 'How should we translate customer FAQ content?',
        strategy: 'chain_of_thought',
        retrieve: false,
      })
      .expect(200);
    expect(reasoned.body.answer).toBeTruthy();
    expect(reasoned.body.confidence.score).toBeGreaterThanOrEqual(0);
    expect(reasoned.body.honesty.toolExecution).toBe(false);
    expect(reasoned.body.historyId).toBeTruthy();

    const tools = await request(app.getHttpServer())
      .post('/v1/reasoning-runtime/select-tools')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ problem: 'translate documents and search knowledge' })
      .expect(200);
    expect(tools.body.honesty.toolExecution).toBe(false);
    expect(tools.body.selectedTools.length).toBeGreaterThan(0);

    const tree = await request(app.getHttpServer())
      .post('/v1/reasoning-runtime/decision-tree')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ problem: 'route a chat request', kind: 'routing' })
      .expect(200);
    expect(tree.body.tree.nodes.length).toBeGreaterThan(1);
    expect(tree.body.honesty.droolsPegaBrms).toBe(false);

    const reflected = await request(app.getHttpServer())
      .post('/v1/reasoning-runtime/reflect')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ historyId: reasoned.body.historyId })
      .expect(200);
    expect(reflected.body.critiques.length).toBeGreaterThan(0);

    const conf = await request(app.getHttpServer())
      .post('/v1/reasoning-runtime/confidence')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ historyId: reasoned.body.historyId })
      .expect(200);
    expect(conf.body.score).toBeGreaterThanOrEqual(0);

    const history = await request(app.getHttpServer())
      .get('/v1/reasoning-runtime/history')
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(history.body.runs.length).toBeGreaterThanOrEqual(1);

    const replay = await request(app.getHttpServer())
      .get(`/v1/reasoning-runtime/history/${reasoned.body.historyId}`)
      .set('Authorization', `Bearer ${key.secret}`)
      .expect(200);
    expect(replay.body.run.problem).toContain('FAQ');

    const model = await request(app.getHttpServer())
      .post('/v1/reasoning-runtime/select-model')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ problem: 'chat reasoning' })
      .expect(200);
    expect(model.body.selection).toBeTruthy();
  });

  it('exposes reasoningRuntimeEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ reasoningRuntimeEngine { product customReasonerKernel toolExecution extendsReasoningCloud regeneratesReasoningCloud mode maxHistoryPerWorkspace capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.reasoningRuntimeEngine.product).toContain('Reasoning Runtime');
    expect(res.body.data.reasoningRuntimeEngine.customReasonerKernel).toBe(false);
    expect(res.body.data.reasoningRuntimeEngine.toolExecution).toBe(false);
    expect(res.body.data.reasoningRuntimeEngine.extendsReasoningCloud).toBe(true);
  });
});

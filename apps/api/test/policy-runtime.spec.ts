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
              clerkUserId: `clerk_pol_${name}_${Date.now()}_${Math.random()}`,
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

describe('Policy Runtime (VL-222)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_POLICY_RUNTIME_MODE;

  beforeAll(async () => {
    process.env.LUGEMI_POLICY_RUNTIME_MODE = 'enforce';

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
        return {
          message: {
            role: 'assistant',
            content: `Sandbox plan for ${user?.content.slice(0, 40) ?? 'goal'}`,
          },
          model: input.model ?? 'fixture-model',
          provider: 'fixture_chat',
          promptTokens: 10,
          completionTokens: 8,
          totalTokens: 18,
          latencyMs: 1,
        };
      },
    });
  });

  afterAll(async () => {
    if (prevMode === undefined) delete process.env.LUGEMI_POLICY_RUNTIME_MODE;
    else process.env.LUGEMI_POLICY_RUNTIME_MODE = prevMode;
    await app.close();
  });

  it('documents Policy Runtime honesty (hard gate; not log-only / OPA OS)', () => {
    const doc = join(root, 'docs/POLICY_RUNTIME.md');
    const adr = join(root, 'docs/adr/0133-policy-runtime.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/hard gate/i);
    expect(text).toMatch(/log/i);
    expect(text).toMatch(/403/);
    expect(text).toMatch(/Agent|Workflow|Plugin/);
  });

  it('exposes engine with hard-gate wiring flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/policy-runtime/engine').expect(200);
    expect(res.body.product).toContain('Policy Runtime');
    expect(res.body.honesty.hardGate).toBe(true);
    expect(res.body.honesty.logOnly).toBe(false);
    expect(res.body.honesty.logOnlyForbidden).toBe(true);
    expect(res.body.honesty.opaOs).toBe(false);
    expect(res.body.honesty.wiredIntoAgentRuntime).toBe(true);
    expect(res.body.honesty.wiredIntoWorkflowRuntime).toBe(true);
    expect(res.body.honesty.wiredIntoPluginRuntime).toBe(true);
    expect(res.body.ceilings.logOnlyForbidden).toBe(true);
    expect(res.body.links.console).toBe('/policy-runtime');
  });

  it('hard-blocks global denies and org policies; wired into Agent Runtime', async () => {
    const org = await seedOrg(prisma, 'pol');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'pol-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    const global = await request(app.getHttpServer())
      .post('/v1/policy-runtime/evaluate')
      .set(auth)
      .send({ action: 'shell.exec', runtime: 'agent-runtime' })
      .expect(200);
    expect(global.body.allowed).toBe(false);
    expect(global.body.hardGate).toBe(true);
    expect(global.body.logOnly).toBe(false);
    expect(global.body.reason).toMatch(/globally denied/i);

    const created = await request(app.getHttpServer())
      .post('/v1/policy-runtime/policies')
      .set(auth)
      .send({
        name: 'Deny memory.put on agents',
        kind: 'security',
        effect: 'deny',
        actions: ['memory.put'],
        targets: ['agent-runtime'],
      })
      .expect(201);
    expect(created.body.policy.id).toMatch(/^pol_/);
    expect(created.body.honesty.hardGate).toBe(true);

    const deniedEval = await request(app.getHttpServer())
      .post('/v1/policy-runtime/evaluate')
      .set(auth)
      .send({ action: 'memory.put', runtime: 'agent-runtime' })
      .expect(200);
    expect(deniedEval.body.allowed).toBe(false);
    expect(deniedEval.body.hardGate).toBe(true);
    expect(deniedEval.body.matchedPolicyIds).toContain(created.body.policy.id);

    const allowedEval = await request(app.getHttpServer())
      .post('/v1/policy-runtime/evaluate')
      .set(auth)
      .send({ action: 'reason.plan', runtime: 'agent-runtime' })
      .expect(200);
    expect(allowedEval.body.allowed).toBe(true);

    // Wire check: Agent Runtime run with memory.put permission is blocked by Policy Runtime
    const agent = await request(app.getHttpServer())
      .post('/v1/agent-runtime/agents')
      .set(auth)
      .send({
        name: 'Policy Gated Agent',
        permissions: ['reason.plan', 'memory.put'],
        goal: 'test policy wiring',
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/v1/agent-runtime/agents/${agent.body.agent.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);

    const run = await request(app.getHttpServer())
      .post('/v1/agent-runtime/run')
      .set(auth)
      .send({
        agentId: agent.body.agent.id,
        actions: [{ action: 'memory.put', input: { content: 'should be blocked' } }],
      })
      .expect(200);
    expect(run.body.run.status).toBe('denied');
    expect(run.body.run.steps[0].allowed).toBe(false);
    expect(run.body.run.steps[0].error).toMatch(/organization policy|Policy Runtime|hard gate/i);

    // Plan still works (not denied by org policy)
    const planRun = await request(app.getHttpServer())
      .post('/v1/agent-runtime/run')
      .set(auth)
      .send({
        agentId: agent.body.agent.id,
        actions: [{ action: 'reason.plan', input: { problem: 'ok' } }],
      })
      .expect(200);
    expect(planRun.body.run.status).toBe('completed');

    const monitoring = await request(app.getHttpServer())
      .get('/v1/policy-runtime/monitoring')
      .set(auth)
      .expect(200);
    expect(monitoring.body.wiring.hardGate).toBe(true);
    expect(monitoring.body.wiring.logOnly).toBe(false);
    expect(monitoring.body.wiring.agentRuntime).toBe(true);
  });

  it('exposes policyRuntimeEngine via GraphQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query:
          '{ policyRuntimeEngine { product hardGate logOnly logOnlyForbidden opaOs wiredIntoAgentRuntime wiredIntoWorkflowRuntime wiredIntoPluginRuntime mode maxPoliciesPerWorkspace } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.policyRuntimeEngine.hardGate).toBe(true);
    expect(res.body.data.policyRuntimeEngine.logOnly).toBe(false);
    expect(res.body.data.policyRuntimeEngine.wiredIntoAgentRuntime).toBe(true);
  });
});

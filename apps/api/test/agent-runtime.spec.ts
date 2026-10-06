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
              clerkUserId: `clerk_ar_${name}_${Date.now}_${Math.random}`,
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

describe('Agent Runtime',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_AGENT_RUNTIME_MODE;

  beforeAll(async  => {
    process.env.LUGEMI_AGENT_RUNTIME_MODE = 'sandbox';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);

    app.get(GatewayService).setChatProviderForTests({
      name: 'fixture_chat',
      async complete(input) {
        const user = [...input.messages].reverse.find((m) => m.role === 'user');
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

  afterAll(async  => {
    if (prevMode === undefined) delete process.env.LUGEMI_AGENT_RUNTIME_MODE;
    else process.env.LUGEMI_AGENT_RUNTIME_MODE = prevMode;
    await app.close;
  });

  it('documents Agent Runtime honesty (sandbox + permissions; not open tool OS)',  => {
    const doc = join(root, 'docs/AGENT_RUNTIME.md');
    const adr = join(root, 'docs/adr/0130-agent-runtime.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/sandbox/i);
    expect(text).toMatch(/permission/i);
    expect(text).toMatch(/open tool/i);
    expect(text).toMatch(/hard/i);
  });

  it('exposes engine with honest safety flags', async  => {
    const res = await request(app.getHttpServer).get('/v1/agent-runtime/engine').expect(200);
    expect(res.body.product).toContain('Agent Runtime');
    expect(res.body.honesty.openToolExecution).toBe(false);
    expect(res.body.honesty.scopedPermissionsRequired).toBe(true);
    expect(res.body.honesty.sandboxRequired).toBe(true);
    expect(res.body.honesty.localPermissionHardGate).toBe(true);
    expect(res.body.honesty.policyRuntimeWired).toBe(true);
    expect(res.body.honesty.langGraphOs).toBe(false);
    expect(res.body.ceilings.liveToolExecution).toBe(false);
    expect(res.body.safety.openToolExecutionForbidden).toBe(true);
    expect(res.body.links.console).toBe('/agent-runtime');

    const perms = await request(app.getHttpServer)
      .get('/v1/agent-runtime/permissions')
      .expect(200);
    expect(perms.body.grantable.some((p: { id: string }) => p.id === 'reason.plan')).toBe(true);
    expect(perms.body.denied.some((p: { id: string }) => p.id === 'shell.exec')).toBe(true);
  });

  it('denies runs without permission and completes sandbox runs with allowlist', async  => {
    const org = await seedOrg(prisma, 'ar');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'ar-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    const created = await request(app.getHttpServer)
      .post('/v1/agent-runtime/agents')
      .set(auth)
      .send({
        name: 'Sandbox Planner',
        permissions: ['reason.plan', 'memory.put', 'memory.search', 'agent.message'],
        goal: 'Plan a harmless FAQ translation',
      })
      .expect(201);
    expect(created.body.agent.id).toMatch(/^agt_/);
    expect(created.body.agent.status).toBe('draft');
    expect(created.body.agent.permissions).toContain('reason.plan');

    const agentId = created.body.agent.id as string;

    await request(app.getHttpServer)
      .post(`/v1/agent-runtime/agents/${agentId}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);

    const denied = await request(app.getHttpServer)
      .post('/v1/agent-runtime/run')
      .set(auth)
      .send({
        agentId,
        actions: [{ action: 'shell.exec', input: { cmd: 'echo hi' } }],
      })
      .expect(200);
    expect(denied.body.run.status).toBe('denied');
    expect(denied.body.run.sandbox).toBe(true);
    expect(denied.body.run.liveToolExecution).toBe(false);
    expect(denied.body.run.steps[0].allowed).toBe(false);
    expect(denied.body.honesty.openToolExecution).toBe(false);

    const missing = await request(app.getHttpServer)
      .post('/v1/agent-runtime/run')
      .set(auth)
      .send({
        agentId,
        actions: [{ action: 'context.assemble', input: { query: 'faq' } }],
      })
      .expect(200);
    expect(missing.body.run.status).toBe('denied');
    expect(missing.body.run.steps[0].error).toMatch(/lacks permission/i);

    const ok = await request(app.getHttpServer)
      .post('/v1/agent-runtime/run')
      .set(auth)
      .send({
        agentId,
        goal: 'Harmless sandbox plan',
        actions: [{ action: 'reason.plan', input: { problem: 'Translate FAQ safely' } }],
      })
      .expect(200);
    expect(ok.body.run.status).toBe('completed');
    expect(ok.body.run.sandbox).toBe(true);
    expect(ok.body.run.steps[0].allowed).toBe(true);
    expect(ok.body.run.steps[0].simulated).toBe(true);

    const mem = await request(app.getHttpServer)
      .post('/v1/agent-runtime/memory')
      .set(auth)
      .send({ agentId, content: 'agent note from ' })
      .expect(201);
    expect(mem.body.memory.content).toContain('agent note');
    expect(mem.body.memory.scope).toBe('agent');
    expect(mem.body.memory.agentId).toBe(agentId);

    const peer = await request(app.getHttpServer)
      .post('/v1/agent-runtime/agents')
      .set(auth)
      .send({
        name: 'Sandbox Peer',
        permissions: ['agent.message', 'reason.plan'],
        goal: 'Collaborate in sandbox',
      })
      .expect(201);
    await request(app.getHttpServer)
      .post(`/v1/agent-runtime/agents/${peer.body.agent.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);

    const collab = await request(app.getHttpServer)
      .post('/v1/agent-runtime/collaborate')
      .set(auth)
      .send({
        agentIds: [agentId, peer.body.agent.id],
        topic: 'sandbox collab',
        message: 'hello sandbox',
      })
      .expect(200);
    expect(collab.body.session.sandbox).toBe(true);
    expect(collab.body.session.transcript.length).toBe(2);
    expect(collab.body.honesty.multiAgentOs).toBe(false);

    const listed = await request(app.getHttpServer)
      .get('/v1/agent-runtime/agents')
      .set(auth)
      .expect(200);
    expect(listed.body.agents.length).toBeGreaterThanOrEqual(2);

    const analytics = await request(app.getHttpServer)
      .get('/v1/agent-runtime/analytics')
      .set(auth)
      .expect(200);
    expect(analytics.body.agentCount).toBeGreaterThanOrEqual(2);
  });

  it('exposes agentRuntimeEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ agentRuntimeEngine { product openToolExecution scopedPermissionsRequired sandboxRequired localPermissionHardGate policyRuntimeWired mode maxAgentsPerWorkspace capabilities { id status } } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.agentRuntimeEngine.openToolExecution).toBe(false);
    expect(res.body.data.agentRuntimeEngine.scopedPermissionsRequired).toBe(true);
    expect(res.body.data.agentRuntimeEngine.sandboxRequired).toBe(true);
    expect(res.body.data.agentRuntimeEngine.localPermissionHardGate).toBe(true);
  });
});

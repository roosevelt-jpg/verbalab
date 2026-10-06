import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { GatewayService } from '../src/gateway/gateway.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');
const apiSrc = join(root, 'apps/api/src');

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkTsFiles(p, out);
    } else if (name.name.endsWith('.ts') && !name.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_akaudit_${name}_${Date.now()}_${Math.random()}`,
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

describe('AI Kernel Production Audit', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  let rawKey: string;

  beforeAll(async () => {
    process.env.LUGEMI_POLICY_RUNTIME_MODE = 'enforce';
    process.env.LUGEMI_AGENT_RUNTIME_MODE = 'sandbox';

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
            content: `Harmless sandbox plan for ${user?.content.slice(0, 40) ?? 'goal'}`,
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

    const org = await seedOrg(prisma, 'aka');
    const created = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'aka-key',
    });
    rawKey = created.secret;
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it('ships audit ADR and report pack', () => {
    expect(existsSync(join(root, 'docs/adr/0134-ai-kernel-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0080-lugemi-cloud-blueprint.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/CLOUD_BLUEPRINT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-kernel-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-kernel-audit/ARCHITECTURE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-kernel-audit/PERFORMANCE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-kernel-audit/COVERAGE_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-kernel-audit/DEPLOYMENT_GUIDE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/ai-kernel-audit/KERNEL_READINESS_REPORT.md'))).toBe(true);
    const readiness = readFileSync(
      join(root, 'docs/ai-kernel-audit/PRODUCTION_READINESS.md'),
      'utf8',
    );
    expect(readiness).toMatch(/not.*customer-facing|Rejected/i);
    expect(readiness).toContain('bounded');
    expect(readiness).toMatch(/hard gate/i);
    expect(readiness).toMatch(/Volume 9|ask when ready/i);
    const adr = readFileSync(
      join(root, 'docs/adr/0134-ai-kernel-production-audit.md'),
      'utf8',
    );
    expect(adr).toMatch(/review gate|checklist/i);
    expect(adr).toMatch(/hard-block|hard gate/i);
  });

  it('has no TODO/FIXME/implement-later markers in AI Kernel source trees', () => {
    const roots = [
      join(apiSrc, 'ai-kernel'),
      join(apiSrc, 'memory-runtime'),
      join(apiSrc, 'prompt-runtime'),
      join(apiSrc, 'context-runtime'),
      join(apiSrc, 'reasoning-runtime'),
      join(apiSrc, 'agent-runtime'),
      join(apiSrc, 'workflow-runtime'),
      join(apiSrc, 'plugin-runtime'),
      join(apiSrc, 'policy-runtime'),
    ];
    const banned = /TODO|FIXME|implement later|XXX\s*:|not implemented/i;
    const hits: string[] = [];
    for (const dir of roots) {
      if (!existsSync(dir)) continue;
      for (const file of walkTsFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (banned.test(text)) hits.push(file.replace(root, ''));
      }
    }
    expect(hits).toEqual([]);
  });

  it('exposes integrated AI Kernel catalogs', async () => {
    const paths = [
      '/v1/ai-kernel/products',
      '/v1/memory-runtime/engine',
      '/v1/prompt-runtime/engine',
      '/v1/context-runtime/engine',
      '/v1/reasoning-runtime/engine',
      '/v1/agent-runtime/engine',
      '/v1/workflow-runtime/engine',
      '/v1/plugin-runtime/engine',
      '/v1/policy-runtime/engine',
    ];
    for (const path of paths) {
      const res = await request(app.getHttpServer()).get(path).expect(200);
      expect(res.body).toBeTruthy();
    }

    const products = await request(app.getHttpServer())
      .get('/v1/ai-kernel/products')
      .expect(200);
    const byId = Object.fromEntries(
      products.body.products.map((p: { id: string; status: string }) => [p.id, p.status]),
    );
    expect(byId['ai-kernel']).toBe('shipped');
    for (const id of [
      'memory-runtime',
      'prompt-runtime',
      'context-runtime',
      'reasoning-runtime',
      'agent-runtime',
      'workflow-runtime',
      'plugin-runtime',
      'policy-runtime',
    ]) {
      expect(byId[id]).toBe('shipped');
    }
  });

  it('verifies action safety: sandbox + Policy hard-gate wiring', async () => {
    const agent = await request(app.getHttpServer()).get('/v1/agent-runtime/engine').expect(200);
    expect(agent.body.honesty.sandboxRequired).toBe(true);
    expect(agent.body.honesty.openToolExecution).toBe(false);
    expect(agent.body.honesty.policyRuntimeWired).toBe(true);

    const workflow = await request(app.getHttpServer())
      .get('/v1/workflow-runtime/engine')
      .expect(200);
    expect(workflow.body.honesty.sandboxRequired).toBe(true);
    expect(workflow.body.honesty.policyRuntimeWired).toBe(true);

    const plugin = await request(app.getHttpServer()).get('/v1/plugin-runtime/engine').expect(200);
    expect(plugin.body.honesty.sandboxRequired).toBe(true);
    expect(plugin.body.honesty.liveCodeExecution).toBe(false);
    expect(plugin.body.honesty.policyRuntimeWired).toBe(true);

    const policy = await request(app.getHttpServer()).get('/v1/policy-runtime/engine').expect(200);
    expect(policy.body.honesty.hardGate).toBe(true);
    expect(policy.body.honesty.logOnly).toBe(false);
    expect(policy.body.honesty.wiredIntoAgentRuntime).toBe(true);
    expect(policy.body.honesty.wiredIntoWorkflowRuntime).toBe(true);
    expect(policy.body.honesty.wiredIntoPluginRuntime).toBe(true);
  });

  it('rejects unauthenticated agent run and policy create (security)', async () => {
    const run = await request(app.getHttpServer())
      .post('/v1/agent-runtime/run')
      .send({ agentId: 'agt_x', actions: [{ action: 'reason.plan' }] });
    expect([401, 403, 503]).toContain(run.status);

    const policy = await request(app.getHttpServer())
      .post('/v1/policy-runtime/policies')
      .send({ name: 'x', actions: ['memory.put'], effect: 'deny' });
    expect([401, 403, 503]).toContain(policy.status);
  });

  it('exercises harmless Agent Runtime task and Policy hard-block (README gate)', async () => {
    const auth = { Authorization: `Bearer ${rawKey}` };

    const created = await request(app.getHttpServer())
      .post('/v1/agent-runtime/agents')
      .set(auth)
      .send({
        name: 'Audit Harmless Agent',
        permissions: ['reason.plan', 'memory.put'],
        goal: 'Draft a harmless translation QA checklist',
      })
      .expect(201);
    const agentId = created.body.agent.id as string;

    await request(app.getHttpServer())
      .post(`/v1/agent-runtime/agents/${agentId}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);

    const ok = await request(app.getHttpServer())
      .post('/v1/agent-runtime/run')
      .set(auth)
      .send({
        agentId,
        actions: [
          {
            action: 'reason.plan',
            input: { problem: 'Harmless FAQ translation QA checklist' },
          },
        ],
      })
      .expect(200);
    expect(ok.body.run.status).toBe('completed');
    expect(ok.body.run.sandbox).toBe(true);
    expect(ok.body.run.liveToolExecution).toBe(false);
    expect(ok.body.run.steps[0].allowed).toBe(true);

    await request(app.getHttpServer())
      .post('/v1/policy-runtime/policies')
      .set(auth)
      .send({
        name: 'Audit deny memory.put',
        kind: 'security',
        effect: 'deny',
        actions: ['memory.put'],
        targets: ['agent-runtime'],
      })
      .expect(201);

    const blocked = await request(app.getHttpServer())
      .post('/v1/agent-runtime/run')
      .set(auth)
      .send({
        agentId,
        actions: [{ action: 'memory.put', input: { content: 'should be blocked' } }],
      })
      .expect(200);
    expect(blocked.body.run.status).toBe('denied');
    expect(blocked.body.run.steps[0].allowed).toBe(false);
    expect(blocked.body.run.steps[0].error).toMatch(/organization policy|Policy Runtime|hard gate/i);
  });

  it('runs bounded sequential load smoke on public kernel catalogs', async () => {
    const paths = [
      '/v1/ai-kernel/products',
      '/v1/memory-runtime/engine',
      '/v1/prompt-runtime/engine',
      '/v1/context-runtime/engine',
      '/v1/reasoning-runtime/engine',
      '/v1/agent-runtime/engine',
      '/v1/workflow-runtime/engine',
      '/v1/plugin-runtime/engine',
      '/v1/policy-runtime/engine',
    ];
    const started = Date.now();
    const iterations = 24;
    for (let i = 0; i < iterations; i++) {
      const path = paths[i % paths.length]!;
      await request(app.getHttpServer()).get(path).expect(200);
    }
    expect(Date.now() - started).toBeLessThan(30_000);
  });

  it('runs bounded rapid stress smoke on ai-kernel products', async () => {
    const started = Date.now();
    for (let i = 0; i < 12; i++) {
      await request(app.getHttpServer()).get('/v1/ai-kernel/products').expect(200);
    }
    expect(Date.now() - started).toBeLessThan(15_000);
  });

  it('GraphQL AI Kernel façade queries respond with honesty flags', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${rawKey}`)
      .send({
        query: `{
          aiKernelRuntimes { id status }
          agentRuntimeEngine { product openToolExecution sandboxRequired policyRuntimeWired }
          workflowRuntimeEngine { product openToolExecution sandboxRequired policyRuntimeWired }
          pluginRuntimeEngine { product liveCodeExecution sandboxRequired policyRuntimeWired }
          policyRuntimeEngine { product hardGate logOnly wiredIntoAgentRuntime wiredIntoWorkflowRuntime wiredIntoPluginRuntime }
        }`,
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.aiKernelRuntimes.length).toBeGreaterThan(5);
    expect(res.body.data.agentRuntimeEngine.openToolExecution).toBe(false);
    expect(res.body.data.agentRuntimeEngine.policyRuntimeWired).toBe(true);
    expect(res.body.data.workflowRuntimeEngine.policyRuntimeWired).toBe(true);
    expect(res.body.data.pluginRuntimeEngine.liveCodeExecution).toBe(false);
    expect(res.body.data.policyRuntimeEngine.hardGate).toBe(true);
    expect(res.body.data.policyRuntimeEngine.logOnly).toBe(false);
    expect(res.body.data.policyRuntimeEngine.wiredIntoAgentRuntime).toBe(true);
  });

  it('documents Volume 8 close and Volume 9 not invented here', () => {
    const living = readFileSync(join(root, 'docs/CLOUD_BLUEPRINT.md'), 'utf8');
    expect(living).toMatch(/\s*→\s*);
    expect(living).toMatch(/Volume 9|unscheduled|ask when ready/i);
    const readiness = readFileSync(
      join(root, 'docs/ai-kernel-audit/KERNEL_READINESS_REPORT.md'),
      'utf8',
    );
    expect(readiness).toMatch(/Volume 9/i);
    expect(readiness).toMatch(/Go/);
  });
});

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AiKernelService } from '../src/ai-kernel/ai-kernel.service';
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
              clerkUserId: `clerk_ak_${name}_${Date.now}_${Math.random}`,
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

describe('AI Kernel Foundation',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let kernel: AiKernelService;

  beforeAll(async  => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile;

    app = moduleFixture.createNestApplication;
    app.useGlobalFilters(new ApiExceptionFilter);
    await app.init;

    prisma = app.get(PrismaService);
    kernel = app.get(AiKernelService);
  });

  afterAll(async  => {
    await app.close;
  });

  it('documents AI Kernel mapping (not customer product / not Linux OS)',  => {
    const doc = join(root, 'docs/AI_KERNEL.md');
    const adr = join(root, 'docs/adr/0125-ai-kernel-foundation.md');
    const readme = join(root, 'docs/roadmap/volume8-ai-kernel/README_VOLUME8.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    expect(existsSync(readme)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/not\*\* a customer-facing|NOT a customer/i);
    expect(text).toMatch(/Linux|VAIOS/i);
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toMatch(/scoped permissions|sandbox/i);
    expect(text).toMatch(/hard gate|Policy Runtime/i);
    expect(text).toContain('');
    const readmeText = readFileSync(readme, 'utf8');
    expect(readmeText).toMatch(/Policy Runtime|sandbox|permissions/i);
  });

  it('exposes public runtime catalog with honest architecture + safety', async  => {
    const res = await request(app.getHttpServer).get('/v1/ai-kernel/products').expect(200);
    expect(res.body.architecture.customerFacingProduct).toBe(false);
    expect(res.body.architecture.linuxOsRewrite).toBe(false);
    expect(res.body.architecture.vaiosOs).toBe(false);
    expect(res.body.architecture.regeneratesVolumes1to7).toBe(false);
    expect(res.body.architecture.hexagonalRewrite).toBe(false);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.agentActionBoundariesRequired).toBe(true);
    expect(res.body.architecture.policyHardGateRequired).toBe(true);
    expect(res.body.architecture.policyLogOnlyForbidden).toBe(true);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.safety.policyMustHardGate).toBe(true);
    expect(res.body.safety.scopedPermissionsRequired).toBe(true);
    expect(res.body.docs).toBe('/docs/AI_KERNEL.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'ai-kernel',
        'memory-runtime',
        'prompt-runtime',
        'context-runtime',
        'reasoning-runtime',
        'agent-runtime',
        'workflow-runtime',
        'plugin-runtime',
        'policy-runtime',
      ]),
    );

    const hub = res.body.products.find((p: { id: string }) => p.id === 'ai-kernel');
    expect(hub.status).toBe('shipped');
    expect(hub.console).toBe('/ai-kernel');

    const agent = res.body.products.find((p: { id: string }) => p.id === 'agent-runtime');
    expect(agent.status).toBe('partial');
    expect(agent.console).toBe('/agent-runtime');
    expect(agent.notes).toMatch(/sandbox|permission/i);

    const workflow = res.body.products.find((p: { id: string }) => p.id === 'workflow-runtime');
    expect(workflow.status).toBe('partial');
    expect(workflow.console).toBe('/workflow-runtime');
    expect(workflow.notes).toMatch(/sandbox|permission/i);

    const plugin = res.body.products.find((p: { id: string }) => p.id === 'plugin-runtime');
    expect(plugin.status).toBe('partial');
    expect(plugin.console).toBe('/plugin-runtime');
    expect(plugin.notes).toMatch(/sandbox|permission/i);

    const policy = res.body.products.find((p: { id: string }) => p.id === 'policy-runtime');
    expect(policy.status).toBe('partial');
    expect(policy.console).toBe('/policy-runtime');
    expect(policy.notes).toMatch(/hard|block|gate/i);
  });

  it('returns org kernel overview with deferred + safety', async  => {
    const org = await seedOrg(prisma, `ak_${Date.now}`);
    const overview = await kernel.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_ak',
      role: 'owner',
    });
    expect(overview.usage.chat).toBeDefined;
    expect(overview.deferred.memoryRuntime).toBe(false);
    expect(overview.deferred.promptRuntime).toBe(false);
    expect(overview.deferred.contextRuntime).toBe(false);
    expect(overview.deferred.reasoningRuntime).toBe(false);
    expect(overview.deferred.agentRuntime).toBe(false);
    expect(overview.deferred.workflowRuntime).toBe(false);
    expect(overview.deferred.pluginRuntime).toBe(false);
    expect(overview.deferred.policyRuntime).toBe(false);
    expect(overview.deferred.regeneratesVolumes1to7).toBe(false);
    expect(overview.safety.policyMustHardGate).toBe(true);
    expect(overview.links.aiKernel).toBe('/ai-kernel');
    expect(overview.links.memoryRuntime).toBe('/memory-runtime');
    expect(overview.links.promptRuntime).toBe('/prompt-runtime');
    expect(overview.links.contextRuntime).toBe('/context-runtime');
    expect(overview.links.reasoningRuntime).toBe('/reasoning-runtime');
    expect(overview.links.agentRuntime).toBe('/agent-runtime');
    expect(overview.links.workflowRuntime).toBe('/workflow-runtime');
    expect(overview.links.pluginRuntime).toBe('/plugin-runtime');
    expect(overview.links.policyRuntime).toBe('/policy-runtime');
    expect(overview.links.inferenceCloud).toBe('/inference-cloud');
    expect(overview.architecture.extendsInferenceCloud).toBe(true);

    const memory = overview.products.find((p: { id: string }) => p.id === 'memory-runtime');
    expect(memory?.status).toBe('partial');
    expect(memory?.console).toBe('/memory-runtime');

    const prompt = overview.products.find((p: { id: string }) => p.id === 'prompt-runtime');
    expect(prompt?.status).toBe('partial');
    expect(prompt?.console).toBe('/prompt-runtime');

    const context = overview.products.find((p: { id: string }) => p.id === 'context-runtime');
    expect(context?.status).toBe('partial');
    expect(context?.console).toBe('/context-runtime');

    const reasoning = overview.products.find((p: { id: string }) => p.id === 'reasoning-runtime');
    expect(reasoning?.status).toBe('partial');
    expect(reasoning?.console).toBe('/reasoning-runtime');

    const agent = overview.products.find((p: { id: string }) => p.id === 'agent-runtime');
    expect(agent?.status).toBe('partial');
    expect(agent?.console).toBe('/agent-runtime');

    const workflow = overview.products.find((p: { id: string }) => p.id === 'workflow-runtime');
    expect(workflow?.status).toBe('partial');
    expect(workflow?.console).toBe('/workflow-runtime');

    const plugin = overview.products.find((p: { id: string }) => p.id === 'plugin-runtime');
    expect(plugin?.status).toBe('partial');
    expect(plugin?.console).toBe('/plugin-runtime');

    const policy = overview.products.find((p: { id: string }) => p.id === 'policy-runtime');
    expect(policy?.status).toBe('partial');
    expect(policy?.console).toBe('/policy-runtime');
  });

  it('exposes aiKernelRuntimes via GraphQL CQRS façade', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query: '{ aiKernelRuntimes { id name status api console notes } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.aiKernelRuntimes.length).toBeGreaterThan(5);
    expect(
      res.body.data.aiKernelRuntimes.some((r: { id: string }) => r.id === 'ai-kernel'),
    ).toBe(true);
  });
});

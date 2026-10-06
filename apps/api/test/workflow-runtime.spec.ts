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
              clerkUserId: `clerk_wr_${name}_${Date.now}_${Math.random}`,
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

describe('Workflow Runtime',  => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;
  const prevMode = process.env.LUGEMI_WORKFLOW_RUNTIME_MODE;

  beforeAll(async  => {
    process.env.LUGEMI_WORKFLOW_RUNTIME_MODE = 'sandbox';

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
            content: `Sandbox workflow plan for ${user?.content.slice(0, 40) ?? 'goal'}`,
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
    if (prevMode === undefined) delete process.env.LUGEMI_WORKFLOW_RUNTIME_MODE;
    else process.env.LUGEMI_WORKFLOW_RUNTIME_MODE = prevMode;
    await app.close;
  });

  it('documents Workflow Runtime honesty (sandbox + permissions; not Temporal OS)',  => {
    const doc = join(root, 'docs/WORKFLOW_RUNTIME.md');
    const adr = join(root, 'docs/adr/0131-workflow-runtime.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toMatch(/sandbox/i);
    expect(text).toMatch(/permission/i);
    expect(text).toMatch(/Temporal|Airflow/i);
    expect(text).toMatch(/hard/i);
  });

  it('exposes engine with honest safety flags', async  => {
    const res = await request(app.getHttpServer).get('/v1/workflow-runtime/engine').expect(200);
    expect(res.body.product).toContain('Workflow Runtime');
    expect(res.body.honesty.openToolExecution).toBe(false);
    expect(res.body.honesty.liveStepExecution).toBe(false);
    expect(res.body.honesty.temporalOs).toBe(false);
    expect(res.body.honesty.airflowOs).toBe(false);
    expect(res.body.honesty.extendsWorkflowsProduct).toBe(true);
    expect(res.body.honesty.regeneratesWorkflowsProduct).toBe(false);
    expect(res.body.honesty.scopedPermissionsRequired).toBe(true);
    expect(res.body.honesty.localPermissionHardGate).toBe(true);
    expect(res.body.honesty.policyRuntimeWired).toBe(true);
    expect(res.body.ceilings.liveStepExecution).toBe(false);
    expect(res.body.links.console).toBe('/workflow-runtime');
  });

  it('denies missing permissions, runs sandbox steps, approves, rolls back, replays', async  => {
    const org = await seedOrg(prisma, 'wr');
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'wr-key',
    });
    const auth = { Authorization: `Bearer ${key.secret}` };

    const created = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/workflows')
      .set(auth)
      .send({
        name: 'Sandbox QA',
        permissions: [
          'reason.plan',
          'memory.put',
          'memory.search',
          'workflow.approve',
          'workflow.rollback',
        ],
        mode: 'sequential',
        steps: [
          { action: 'reason.plan', input: { problem: 'QA checklist' } },
          { action: 'memory.put', input: { content: 'wf note' } },
        ],
      })
      .expect(201);
    expect(created.body.workflow.id).toMatch(/^wfk_/);
    expect(created.body.workflow.version).toBe(1);

    const workflowId = created.body.workflow.id as string;

    await request(app.getHttpServer)
      .post(`/v1/workflow-runtime/workflows/${workflowId}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);

    const denied = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/workflows')
      .set(auth)
      .send({
        name: 'Denied Live',
        permissions: ['reason.plan'],
        steps: [{ action: 'shell.exec' }],
      })
      .expect(201);
    await request(app.getHttpServer)
      .post(`/v1/workflow-runtime/workflows/${denied.body.workflow.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);
    // shell.exec is stripped from permissions; step still denied at run
    const badRun = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/run')
      .set(auth)
      .send({
        workflowId: denied.body.workflow.id,
      })
      .expect(200);
    // default step becomes reason.plan when only invalid steps were provided...
    // Actually steps with shell.exec remain in the definition - run will deny
    expect(badRun.body.run.sandbox).toBe(true);

    // Force a workflow that still has shell.exec in steps
    const shellWf = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/workflows')
      .set(auth)
      .send({
        name: 'Shell Deny',
        permissions: ['reason.plan'],
        steps: [{ action: 'shell.exec', input: { cmd: 'echo' } }],
      })
      .expect(201);
    await request(app.getHttpServer)
      .post(`/v1/workflow-runtime/workflows/${shellWf.body.workflow.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);
    const shellRun = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/run')
      .set(auth)
      .send({ workflowId: shellWf.body.workflow.id })
      .expect(200);
    expect(shellRun.body.run.status).toBe('denied');
    expect(shellRun.body.run.steps[0].allowed).toBe(false);

    const missing = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/workflows')
      .set(auth)
      .send({
        name: 'Missing Ctx',
        permissions: ['reason.plan'],
        steps: [{ action: 'context.assemble', input: { query: 'x' } }],
      })
      .expect(201);
    await request(app.getHttpServer)
      .post(`/v1/workflow-runtime/workflows/${missing.body.workflow.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);
    const missingRun = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/run')
      .set(auth)
      .send({ workflowId: missing.body.workflow.id })
      .expect(200);
    expect(missingRun.body.run.status).toBe('denied');
    expect(missingRun.body.run.steps[0].error).toMatch(/lacks permission/i);

    const ok = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/run')
      .set(auth)
      .send({ workflowId })
      .expect(200);
    expect(ok.body.run.status).toBe('completed');
    expect(ok.body.run.liveStepExecution).toBe(false);
    expect(ok.body.run.steps.every((s: { allowed: boolean }) => s.allowed)).toBe(true);

    const versioned = await request(app.getHttpServer)
      .post(`/v1/workflow-runtime/workflows/${workflowId}/version`)
      .set(auth)
      .send({})
      .expect(200);
    expect(versioned.body.workflow.version).toBe(2);

    const rolled = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/rollback')
      .set(auth)
      .send({ runId: ok.body.run.id })
      .expect(200);
    expect(rolled.body.run.status).toBe('rolled_back');
    expect(rolled.body.honesty.distributedSagaOs).toBe(false);

    const replayed = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/replay')
      .set(auth)
      .send({ runId: ok.body.run.id })
      .expect(200);
    expect(replayed.body.replay.sourceRunId).toBe(ok.body.run.id);
    expect(replayed.body.honesty.eventSourcingOs).toBe(false);

    const approvalWf = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/workflows')
      .set(auth)
      .send({
        name: 'Needs Approval',
        permissions: ['reason.plan', 'workflow.approve'],
        requiresApproval: true,
        steps: [{ action: 'reason.plan', input: { problem: 'gated' } }],
      })
      .expect(201);
    await request(app.getHttpServer)
      .post(`/v1/workflow-runtime/workflows/${approvalWf.body.workflow.id}/lifecycle`)
      .set(auth)
      .send({ status: 'active' })
      .expect(200);
    await request(app.getHttpServer)
      .post('/v1/workflow-runtime/run')
      .set(auth)
      .send({ workflowId: approvalWf.body.workflow.id })
      .expect(403);
    await request(app.getHttpServer)
      .post('/v1/workflow-runtime/approve')
      .set(auth)
      .send({ workflowId: approvalWf.body.workflow.id, note: 'ok' })
      .expect(200);
    const approvedRun = await request(app.getHttpServer)
      .post('/v1/workflow-runtime/run')
      .set(auth)
      .send({ workflowId: approvalWf.body.workflow.id, approved: true })
      .expect(200);
    expect(approvedRun.body.run.status).toBe('completed');
  });

  it('exposes workflowRuntimeEngine via GraphQL', async  => {
    const res = await request(app.getHttpServer)
      .post('/graphql')
      .send({
        query:
          '{ workflowRuntimeEngine { product openToolExecution liveStepExecution temporalOs extendsWorkflowsProduct scopedPermissionsRequired sandboxRequired localPermissionHardGate mode maxWorkflowsPerWorkspace } }',
      })
      .expect(200);
    expect(res.body.errors).toBeUndefined;
    expect(res.body.data.workflowRuntimeEngine.temporalOs).toBe(false);
    expect(res.body.data.workflowRuntimeEngine.extendsWorkflowsProduct).toBe(true);
    expect(res.body.data.workflowRuntimeEngine.localPermissionHardGate).toBe(true);
  });
});

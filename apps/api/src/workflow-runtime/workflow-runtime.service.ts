import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemoryRuntimeService } from '../memory-runtime/memory-runtime.service';
import { ReasoningRuntimeService } from '../reasoning-runtime/reasoning-runtime.service';
import { ContextRuntimeService } from '../context-runtime/context-runtime.service';
import { ApiException } from '../common/errors/api-exception';
import { WorkflowPolicyGate } from './workflow-policy.gate';
import {
  WORKFLOW_PERMISSIONS,
  workflowRuntimeCatalog,
  workflowRuntimeCeilings,
  workflowRuntimeMode,
} from './workflow-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type WorkflowDef = {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'active' | 'paused' | 'archived';
  permissions: string[];
  mode: 'sequential' | 'parallel';
  steps: Array<{ action: string; input?: Record<string, unknown> }>;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
};

type RunStep = {
  action: string;
  allowed: boolean;
  simulated: boolean;
  attempt: number;
  parallelGroup?: number;
  result?: unknown;
  error?: string;
  at: string;
};

const RUNTIME = 'workflow-runtime';
const KERNEL_LAYER = 'kernel';

@Injectable()
export class WorkflowRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: WorkflowPolicyGate,
    private readonly memoryRuntime: MemoryRuntimeService,
    private readonly reasoningRuntime: ReasoningRuntimeService,
    private readonly contextRuntime: ContextRuntimeService,
  ) {}

  engine() {
    return {
      ...workflowRuntimeCatalog(),
      ceilings: workflowRuntimeCeilings(),
      mode: workflowRuntimeMode(),
      safety: {
        scopedPermissionsRequired: true,
        sandboxRequired: true,
        openToolExecutionForbidden: true,
        liveStepExecutionForbidden: true,
        policyMustHardGate: true,
        note:
          'Every workflow step passes WorkflowPolicyGate (local hard allowlist). Policy Runtime (VL-222) will harden further. Extends /v1/workflows — not Temporal/Airflow.',
      },
    };
  }

  permissions() {
    return {
      grantable: WORKFLOW_PERMISSIONS.map((id) => ({ id })),
      denied: workflowRuntimeCatalog().deniedActions,
      note: 'Only grantable permissions may be attached to a workflow. Denied actions cannot be granted.',
    };
  }

  async createWorkflow(
    input: AuthCtx & {
      name?: string;
      permissions?: string[];
      mode?: string;
      steps?: Array<{ action: string; input?: Record<string, unknown> }>;
      requiresApproval?: boolean;
    },
  ) {
    this.assertEnabled();
    const name = (input.name ?? '').trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const ceilings = workflowRuntimeCeilings();
    const existing = await this.listWorkflows(input);
    if (existing.workflows.length >= ceilings.maxWorkflowsPerWorkspace) {
      throw new ApiException(
        'workflow_runtime_ceiling',
        `Hard workflow ceiling exceeded: ${existing.workflows.length} >= maxWorkflowsPerWorkspace ${ceilings.maxWorkflowsPerWorkspace}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const mode = input.mode === 'parallel' ? 'parallel' : 'sequential';
    const steps = Array.isArray(input.steps) ? input.steps.slice(0, ceilings.maxStepsPerRun) : [];
    const now = new Date().toISOString();
    const workflow: WorkflowDef = {
      id: `wfk_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      name: name.slice(0, 80),
      version: 1,
      status: 'draft',
      permissions: this.policy.normalizePermissions(input.permissions),
      mode,
      steps,
      requiresApproval: Boolean(input.requiresApproval),
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRecord(input, {
      key: `workflow:${workflow.id}`,
      content: workflow,
      meta: { type: 'workflow', workflowId: workflow.id, status: workflow.status, version: 1 },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow_runtime.workflow_created',
      route: 'POST /v1/workflow-runtime/workflows',
      ip: input.ip,
      metadata: { workflowId: workflow.id, permissions: workflow.permissions },
    });

    return {
      workflow,
      honesty: workflowRuntimeCatalog().honesty,
      note: 'Kernel workflow created in draft. Activate before run. Permissions are a hard allowlist.',
    };
  }

  async listWorkflows(input: AuthCtx) {
    this.assertEnabled();
    const rows = await this.findByType(input, 'workflow', 100);
    const workflows = rows
      .map((r) => this.parseJson<WorkflowDef>(r.content))
      .filter((w): w is WorkflowDef => Boolean(w?.id));
    return {
      workflows,
      note: 'Kernel workflows (MemoryRecords). Product definitions remain at /v1/workflows.',
    };
  }

  async getWorkflow(input: AuthCtx & { id?: string }) {
    const workflow = await this.requireWorkflow(input, input.id);
    return { workflow };
  }

  async lifecycle(input: AuthCtx & { id?: string; status?: string }) {
    this.assertEnabled();
    const workflow = await this.requireWorkflow(input, input.id);
    const status = (input.status ?? '').trim() as WorkflowDef['status'];
    if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
      throw new ApiException(
        'validation_error',
        'status must be draft|active|paused|archived',
        HttpStatus.BAD_REQUEST,
      );
    }
    workflow.status = status;
    workflow.updatedAt = new Date().toISOString();
    await this.writeRecord(input, {
      key: `workflow:${workflow.id}`,
      content: workflow,
      meta: {
        type: 'workflow',
        workflowId: workflow.id,
        status,
        version: workflow.version,
      },
      replaceKey: `workflow:${workflow.id}`,
    });
    return { workflow, note: 'Lifecycle updated.' };
  }

  async version(input: AuthCtx & { id?: string; steps?: WorkflowDef['steps'] }) {
    this.assertEnabled();
    const workflow = await this.requireWorkflow(input, input.id);
    if (input.steps) {
      workflow.steps = input.steps.slice(0, workflowRuntimeCeilings().maxStepsPerRun);
    }
    workflow.version += 1;
    workflow.updatedAt = new Date().toISOString();
    await this.writeRecord(input, {
      key: `workflow:${workflow.id}`,
      content: workflow,
      meta: {
        type: 'workflow',
        workflowId: workflow.id,
        status: workflow.status,
        version: workflow.version,
      },
      replaceKey: `workflow:${workflow.id}`,
    });
    await this.writeRecord(input, {
      key: `workflow-version:${workflow.id}:v${workflow.version}`,
      content: { ...workflow },
      meta: {
        type: 'workflow_version',
        workflowId: workflow.id,
        version: workflow.version,
      },
    });
    return { workflow, note: `Version bumped to ${workflow.version}.` };
  }

  async run(
    input: AuthCtx & {
      workflowId?: string;
      forceFailAction?: string;
      approved?: boolean;
    },
  ) {
    this.assertEnabled();
    const workflow = await this.requireWorkflow(input, input.workflowId);
    if (workflow.status !== 'active') {
      throw new ApiException(
        'workflow_not_active',
        `Workflow must be active to run (status=${workflow.status})`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (workflow.requiresApproval && !input.approved) {
      throw new ApiException(
        'workflow_approval_required',
        'Workflow requires human approval before run (POST /v1/workflow-runtime/approve).',
        HttpStatus.FORBIDDEN,
      );
    }

    const ceilings = workflowRuntimeCeilings();
    const requested =
      workflow.steps.length > 0
        ? workflow.steps
        : [{ action: 'reason.plan', input: { problem: workflow.name } }];

    if (requested.length > ceilings.maxStepsPerRun) {
      throw new ApiException(
        'workflow_runtime_ceiling',
        `Hard step ceiling exceeded: ${requested.length} > maxStepsPerRun ${ceilings.maxStepsPerRun}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const runId = `wrun_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const steps: RunStep[] = [];

    if (workflow.mode === 'parallel') {
      const results = await Promise.all(
        requested.map((step, idx) =>
          this.runStep(input, workflow, step, idx, input.forceFailAction),
        ),
      );
      steps.push(...results);
    } else {
      for (let i = 0; i < requested.length; i++) {
        const step = await this.runStep(
          input,
          workflow,
          requested[i]!,
          undefined,
          input.forceFailAction,
        );
        steps.push(step);
        if (!step.allowed) break;
      }
    }

    const denied = steps.some((s) => !s.allowed);
    const run = {
      id: runId,
      workflowId: workflow.id,
      version: workflow.version,
      mode: workflow.mode,
      status: denied ? 'denied' : 'completed',
      sandbox: true,
      liveStepExecution: false,
      steps,
      createdAt: new Date().toISOString(),
    };

    await this.writeRecord(input, {
      key: `workflow-run:${runId}`,
      content: run,
      meta: {
        type: 'workflow_run',
        workflowId: workflow.id,
        runId,
        status: run.status,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow_runtime.ran',
      route: 'POST /v1/workflow-runtime/run',
      ip: input.ip,
      metadata: { runId, workflowId: workflow.id, steps: steps.length, denied },
    });

    return {
      run,
      honesty: {
        ...workflowRuntimeCatalog().honesty,
        simulatedSteps: true,
      },
      note: denied
        ? 'Run stopped on hard permission/policy deny.'
        : 'Sandbox workflow completed — steps simulated within allowlist; not live Temporal/Airflow execution.',
    };
  }

  async approve(input: AuthCtx & { workflowId?: string; note?: string }) {
    this.assertEnabled();
    const workflow = await this.requireWorkflow(input, input.workflowId);
    await this.policy.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      workflowId: workflow.id,
      action: 'workflow.approve',
      permissions: workflow.permissions,
    });
    const approvalId = `appr_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const approval = {
      id: approvalId,
      workflowId: workflow.id,
      note: (input.note ?? 'approved in sandbox').trim().slice(0, 200),
      approved: true,
      sandbox: true,
      createdAt: new Date().toISOString(),
    };
    await this.writeRecord(input, {
      key: `workflow-approval:${approvalId}`,
      content: approval,
      meta: { type: 'workflow_approval', workflowId: workflow.id, approvalId },
    });
    return {
      approval,
      honesty: { bpmOs: false },
      note: 'Sandbox approval recorded — not an enterprise BPM OS. Pass approved:true on /run.',
    };
  }

  async schedule(
    input: AuthCtx & { workflowId?: string; runAt?: string },
  ) {
    this.assertEnabled();
    const workflow = await this.requireWorkflow(input, input.workflowId);
    await this.policy.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      workflowId: workflow.id,
      action: 'workflow.schedule',
      permissions: workflow.permissions,
    });
    const runAt = input.runAt ? new Date(input.runAt) : new Date(Date.now() + 3600_000);
    if (Number.isNaN(runAt.getTime())) {
      throw new ApiException('validation_error', 'runAt must be ISO datetime', HttpStatus.BAD_REQUEST);
    }
    const scheduleId = `wsched_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const row = {
      id: scheduleId,
      workflowId: workflow.id,
      runAt: runAt.toISOString(),
      status: 'scheduled',
      sandbox: true,
      createdAt: new Date().toISOString(),
    };
    await this.writeRecord(input, {
      key: `workflow-sched:${scheduleId}`,
      content: row,
      meta: { type: 'workflow_schedule', workflowId: workflow.id, scheduleId },
    });
    return {
      schedule: row,
      honesty: { cronFleetOs: false },
      note: 'Schedule recorded — not an autonomous cron fleet OS. Execute later via /run.',
    };
  }

  async rollback(input: AuthCtx & { runId?: string }) {
    this.assertEnabled();
    const runId = (input.runId ?? '').trim();
    if (!runId) {
      throw new ApiException('validation_error', 'runId is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        key: `workflow-run:${runId}`,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    const run = row ? this.parseJson<Record<string, unknown>>(row.content) : null;
    if (!run?.id) {
      throw new ApiException('not_found', 'Workflow run not found', HttpStatus.NOT_FOUND);
    }
    const workflowId = String(run.workflowId ?? '');
    const workflow = await this.requireWorkflow(input, workflowId);
    await this.policy.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      workflowId: workflow.id,
      action: 'workflow.rollback',
      permissions: workflow.permissions,
    });

    const rolled = {
      ...run,
      status: 'rolled_back',
      rolledBackAt: new Date().toISOString(),
      sandbox: true,
    };
    await this.writeRecord(input, {
      key: `workflow-run:${runId}`,
      content: rolled,
      meta: {
        type: 'workflow_run',
        workflowId,
        runId,
        status: 'rolled_back',
      },
      replaceKey: `workflow-run:${runId}`,
    });
    return {
      run: rolled,
      honesty: { distributedSagaOs: false },
      note: 'Sandbox rollback marker — not a distributed saga/compensation OS.',
    };
  }

  async replay(input: AuthCtx & { runId?: string }) {
    this.assertEnabled();
    const runId = (input.runId ?? '').trim();
    if (!runId) {
      throw new ApiException('validation_error', 'runId is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        key: `workflow-run:${runId}`,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    const prior = row ? this.parseJson<{ id: string; workflowId: string; steps?: RunStep[] }>(row.content) : null;
    if (!prior?.id) {
      throw new ApiException('not_found', 'Workflow run not found', HttpStatus.NOT_FOUND);
    }
    const replayId = `wrep_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const replay = {
      id: replayId,
      sourceRunId: prior.id,
      workflowId: prior.workflowId,
      steps: (prior.steps ?? []).map((s) => ({
        ...s,
        simulated: true,
        replayed: true,
        at: new Date().toISOString(),
      })),
      sandbox: true,
      createdAt: new Date().toISOString(),
    };
    await this.writeRecord(input, {
      key: `workflow-replay:${replayId}`,
      content: replay,
      meta: { type: 'workflow_replay', runId: prior.id, replayId },
    });
    return {
      replay,
      honesty: { eventSourcingOs: false },
      note: 'Sandbox replay of recorded steps — not an event-sourcing OS.',
    };
  }

  async analytics(input: AuthCtx) {
    this.assertEnabled();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const actions = [
      'workflow_runtime.workflow_created',
      'workflow_runtime.ran',
    ] as const;
    const counts = await Promise.all(
      actions.map(async (action) => ({
        action,
        count: await this.prisma.auditEvent.count({
          where: {
            organizationId: input.organizationId,
            action,
            createdAt: { gte: start },
          },
        }),
      })),
    );
    const workflows = await this.listWorkflows(input);
    return {
      periodStart: start.toISOString(),
      workspaceId: input.workspaceId,
      workflowCount: workflows.workflows.length,
      events: counts.reduce((s, c) => s + c.count, 0),
      byAction: Object.fromEntries(counts.map((c) => [c.action, c.count])),
      honesty: workflowRuntimeCatalog().honesty,
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics] = await Promise.all([
      Promise.resolve(this.engine()),
      this.analytics(input),
    ]);
    return {
      mode: engine.mode,
      ceilings: engine.ceilings,
      analytics,
      safety: engine.safety,
      honesty: engine.honesty,
    };
  }

  private async runStep(
    input: AuthCtx,
    workflow: WorkflowDef,
    step: { action: string; input?: Record<string, unknown> },
    parallelGroup: number | undefined,
    forceFailAction?: string,
  ): Promise<RunStep> {
    const ceilings = workflowRuntimeCeilings();
    let attempt = 0;
    let lastError = '';

    while (attempt <= ceilings.maxRetries) {
      attempt += 1;
      const at = new Date().toISOString();
      try {
        if (forceFailAction && forceFailAction === step.action && attempt === 1) {
          throw new Error('simulated_step_failure');
        }
        const gate = await this.policy.assertAllowed({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          workflowId: workflow.id,
          action: step.action,
          permissions: workflow.permissions,
        });
        const result = await this.executeSandboxed(
          input,
          workflow,
          gate.action,
          step.input ?? {},
        );
        return {
          action: gate.action,
          allowed: true,
          simulated: true,
          attempt,
          parallelGroup,
          result,
          at,
        };
      } catch (err) {
        const message = err instanceof ApiException ? err.message : String((err as Error)?.message ?? 'Action failed');
        const status =
          err instanceof ApiException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        lastError = message;
        if (status === HttpStatus.FORBIDDEN) {
          return {
            action: step.action,
            allowed: false,
            simulated: true,
            attempt,
            parallelGroup,
            error: message,
            at,
          };
        }
        if (attempt > ceilings.maxRetries) {
          return {
            action: step.action,
            allowed: false,
            simulated: true,
            attempt,
            parallelGroup,
            error: lastError,
            at,
          };
        }
      }
    }

    return {
      action: step.action,
      allowed: false,
      simulated: true,
      attempt,
      parallelGroup,
      error: lastError || 'Action failed',
      at: new Date().toISOString(),
    };
  }

  private async executeSandboxed(
    input: AuthCtx,
    workflow: WorkflowDef,
    action: string,
    payload: Record<string, unknown>,
  ) {
    switch (action) {
      case 'reason.plan':
        return this.reasoningRuntime.plan({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          problem: String(payload.problem ?? workflow.name),
          sandboxOnly: true,
        });
      case 'memory.put':
        return this.memoryRuntime.put({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          scope: 'workspace',
          kind: 'long_term',
          content: String(payload.content ?? `workflow ${workflow.id} note`),
        });
      case 'memory.search':
        return this.memoryRuntime.search({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          query: String(payload.query ?? workflow.name),
          scope: 'workspace',
        });
      case 'context.assemble':
        return this.contextRuntime.assemble({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          userId: input.userId,
          ip: input.ip,
          query: String(payload.query ?? workflow.name),
          modelHint: `workflow:${workflow.id}`,
          maxChars: 2000,
          include: { documents: false, knowledgeGraph: false },
          useCache: false,
        });
      case 'workflow.approve':
        return this.approve({ ...input, workflowId: workflow.id, note: String(payload.note ?? '') });
      case 'workflow.rollback':
        return { action: 'workflow.rollback', simulated: true, note: 'Use POST /rollback with runId' };
      case 'workflow.notify':
        return {
          channel: String(payload.channel ?? 'sandbox'),
          message: String(payload.message ?? 'sandbox notify'),
          simulated: true,
          delivered: false,
        };
      case 'workflow.schedule':
        return this.schedule({
          ...input,
          workflowId: workflow.id,
          runAt: typeof payload.runAt === 'string' ? payload.runAt : undefined,
        });
      default:
        throw new ApiException(
          'workflow_policy_denied',
          `Unsupported sandbox action ${action}`,
          HttpStatus.FORBIDDEN,
        );
    }
  }

  private assertEnabled() {
    if (workflowRuntimeMode() === 'disabled') {
      throw new ApiException(
        'workflow_runtime_disabled',
        'Workflow Runtime mode is disabled (VERBALAB_WORKFLOW_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async requireWorkflow(input: AuthCtx, id?: string) {
    const workflowId = (id ?? '').trim();
    if (!workflowId) {
      throw new ApiException('validation_error', 'workflow id is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        key: `workflow:${workflowId}`,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    const workflow = row ? this.parseJson<WorkflowDef>(row.content) : null;
    if (!workflow?.id) {
      throw new ApiException('not_found', 'Workflow not found', HttpStatus.NOT_FOUND);
    }
    return workflow;
  }

  private async findByType(input: AuthCtx, type: string, take: number) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, take * 3),
    });
    return rows.filter((r) => this.metaOf(r).type === type).slice(0, take);
  }

  private async writeRecord(
    input: AuthCtx,
    opts: {
      key: string;
      content: unknown;
      meta: Record<string, unknown>;
      replaceKey?: string;
    },
  ) {
    if (opts.replaceKey) {
      await this.prisma.memoryRecord.updateMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          key: opts.replaceKey,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
    }
    return this.prisma.memoryRecord.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        scope: 'workspace',
        kind: 'long_term',
        key: opts.key,
        content: JSON.stringify(opts.content),
        metadata: {
          layer: KERNEL_LAYER,
          runtime: RUNTIME,
          ...opts.meta,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private parseJson<T>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private metaOf(row: { metadata: Prisma.JsonValue }): Record<string, unknown> {
    if (!row.metadata || typeof row.metadata !== 'object' || Array.isArray(row.metadata)) {
      return {};
    }
    return row.metadata as Record<string, unknown>;
  }
}

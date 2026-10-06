import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemoryRuntimeService } from '../memory-runtime/memory-runtime.service';
import { ReasoningRuntimeService } from '../reasoning-runtime/reasoning-runtime.service';
import { ContextRuntimeService } from '../context-runtime/context-runtime.service';
import { ApiException } from '../common/errors/api-exception';
import { AgentPolicyGate } from './agent-policy.gate';
import {
  AGENT_PERMISSIONS,
  agentRuntimeCatalog,
  agentRuntimeCeilings,
  agentRuntimeMode,
} from './agent-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type AgentRecord = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  permissions: string[];
  goal?: string;
  createdAt: string;
  updatedAt: string;
};

type RunStep = {
  action: string;
  allowed: boolean;
  simulated: boolean;
  result?: unknown;
  error?: string;
  at: string;
};

const RUNTIME = 'agent-runtime';
const KERNEL_LAYER = 'kernel';

@Injectable()
export class AgentRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: AgentPolicyGate,
    private readonly memoryRuntime: MemoryRuntimeService,
    private readonly reasoningRuntime: ReasoningRuntimeService,
    private readonly contextRuntime: ContextRuntimeService,
  ) {}

  engine() {
    return {
      ...agentRuntimeCatalog(),
      ceilings: agentRuntimeCeilings(),
      mode: agentRuntimeMode(),
      safety: {
        scopedPermissionsRequired: true,
        sandboxRequired: true,
        openToolExecutionForbidden: true,
        policyMustHardGate: true,
        note:
          'Every agent action passes AgentPolicyGate (local hard allowlist). Policy Runtime will harden further — Agent already blocks missing permissions and denied actions.',
      },
    };
  }

  permissions() {
    return {
      grantable: AGENT_PERMISSIONS.map((id) => ({ id })),
      denied: agentRuntimeCatalog().deniedActions,
      note: 'Only grantable permissions may be attached to an agent. Denied actions cannot be granted.',
    };
  }

  async createAgent(
    input: AuthCtx & { name?: string; permissions?: string[]; goal?: string },
  ) {
    this.assertEnabled();
    const name = (input.name ?? '').trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const ceilings = agentRuntimeCeilings();
    const existing = await this.listAgents(input);
    if (existing.agents.length >= ceilings.maxAgentsPerWorkspace) {
      throw new ApiException(
        'agent_runtime_ceiling',
        `Hard agent ceiling exceeded: ${existing.agents.length} >= maxAgentsPerWorkspace ${ceilings.maxAgentsPerWorkspace}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const now = new Date().toISOString();
    const agent: AgentRecord = {
      id: `agt_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      name: name.slice(0, 80),
      status: 'draft',
      permissions: this.policy.normalizePermissions(input.permissions),
      goal: input.goal?.trim().slice(0, 500) || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRecord(input, {
      key: `agent:${agent.id}`,
      content: agent,
      meta: { type: 'agent', agentId: agent.id, status: agent.status },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'agent_runtime.agent_created',
      route: 'POST /v1/agent-runtime/agents',
      ip: input.ip,
      metadata: { agentId: agent.id, permissions: agent.permissions },
    });

    return {
      agent,
      honesty: agentRuntimeCatalog().honesty,
      note: 'Agent created in draft. Activate before run. Permissions are a hard allowlist.',
    };
  }

  async listAgents(input: AuthCtx) {
    this.assertEnabled();
    const rows = await this.findByType(input, 'agent', 100);
    const agents = rows
      .map((r) => this.parseJson<AgentRecord>(r.content))
      .filter((a): a is AgentRecord => Boolean(a?.id));
    return { agents, note: 'Workspace agents (kernel MemoryRecords).' };
  }

  async getAgent(input: AuthCtx & { id?: string }) {
    const agent = await this.requireAgent(input, input.id);
    return { agent };
  }

  async lifecycle(
    input: AuthCtx & { id?: string; status?: string },
  ) {
    this.assertEnabled();
    const agent = await this.requireAgent(input, input.id);
    const status = (input.status ?? '').trim() as AgentRecord['status'];
    if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
      throw new ApiException(
        'validation_error',
        'status must be draft|active|paused|archived',
        HttpStatus.BAD_REQUEST,
      );
    }
    agent.status = status;
    agent.updatedAt = new Date().toISOString();
    await this.writeRecord(input, {
      key: `agent:${agent.id}`,
      content: agent,
      meta: { type: 'agent', agentId: agent.id, status },
      replaceKey: `agent:${agent.id}`,
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'agent_runtime.lifecycle',
      route: 'POST /v1/agent-runtime/agents/:id/lifecycle',
      ip: input.ip,
      metadata: { agentId: agent.id, status },
    });
    return { agent, note: 'Lifecycle updated.' };
  }

  async run(
    input: AuthCtx & {
      agentId?: string;
      goal?: string;
      actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    },
  ) {
    this.assertEnabled();
    const agent = await this.requireAgent(input, input.agentId);
    if (agent.status !== 'active') {
      throw new ApiException(
        'agent_not_active',
        `Agent must be active to run (status=${agent.status})`,
        HttpStatus.FORBIDDEN,
      );
    }

    const ceilings = agentRuntimeCeilings();
    const goal = (input.goal ?? agent.goal ?? 'sandbox agent goal').trim();
    const requested =
      input.actions?.length
        ? input.actions
        : [{ action: 'reason.plan', input: { problem: goal } }];

    if (requested.length > ceilings.maxStepsPerRun) {
      throw new ApiException(
        'agent_runtime_ceiling',
        `Hard step ceiling exceeded: ${requested.length} > maxStepsPerRun ${ceilings.maxStepsPerRun}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const runId = `run_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const steps: RunStep[] = [];

    for (const step of requested) {
      const at = new Date().toISOString();
      try {
        const gate = await this.policy.assertAllowed({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          agentId: agent.id,
          action: step.action,
          permissions: agent.permissions,
        });
        const result = await this.executeSandboxed(input, agent, gate.action, step.input ?? {});
        steps.push({
          action: gate.action,
          allowed: true,
          simulated: true,
          result,
          at,
        });
      } catch (err) {
        const message = err instanceof ApiException ? err.message : 'Action failed';
        const status =
          err instanceof ApiException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        steps.push({
          action: step.action,
          allowed: false,
          simulated: true,
          error: message,
          at,
        });
        // Hard-stop run on policy deny
        if (status === HttpStatus.FORBIDDEN) {
          break;
        }
      }
    }

    const denied = steps.some((s) => !s.allowed);
    const run = {
      id: runId,
      agentId: agent.id,
      goal,
      status: denied ? 'denied' : 'completed',
      sandbox: true,
      liveToolExecution: false,
      steps,
      createdAt: new Date().toISOString(),
    };

    await this.writeRecord(input, {
      key: `agent-run:${runId}`,
      content: run,
      meta: { type: 'agent_run', agentId: agent.id, runId, status: run.status },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'agent_runtime.ran',
      route: 'POST /v1/agent-runtime/run',
      ip: input.ip,
      metadata: {
        runId,
        agentId: agent.id,
        steps: steps.length,
        denied,
      },
    });

    return {
      run,
      honesty: {
        ...agentRuntimeCatalog().honesty,
        openToolExecution: false,
        simulatedSteps: true,
      },
      note: denied
        ? 'Run stopped on hard permission/policy deny.'
        : 'Sandbox run completed — actions simulated within allowlist; not open tool execution.',
    };
  }

  async collaborate(
    input: AuthCtx & {
      agentIds?: string[];
      topic?: string;
      message?: string;
    },
  ) {
    this.assertEnabled();
    const ids = (input.agentIds ?? []).filter(Boolean);
    if (ids.length < 2) {
      throw new ApiException(
        'validation_error',
        'agentIds must include at least 2 agents',
        HttpStatus.BAD_REQUEST,
      );
    }
    const agents: Array<{ id: string; name: string; permissions: string[] }> = [];
    for (const id of ids.slice(0, 6)) {
      agents.push(await this.requireAgent(input, id));
    }
    for (const agent of agents) {
      await this.policy.assertAllowed({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        agentId: agent.id,
        action: 'agent.message',
        permissions: agent.permissions,
      });
    }

    const sessionId = `collab_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const topic = (input.topic ?? 'sandbox collaboration').trim().slice(0, 200);
    const message = (input.message ?? 'hello from sandbox').trim().slice(0, 500);
    const transcript = agents.map((a, i) => ({
      from: a.id,
      to: agents[(i + 1) % agents.length]!.id,
      body: `[sandbox] ${a.name}: ${message}`,
      at: new Date().toISOString(),
    }));

    const session = {
      id: sessionId,
      topic,
      agentIds: agents.map((a) => a.id),
      transcript,
      sandbox: true,
      createdAt: new Date().toISOString(),
    };

    await this.writeRecord(input, {
      key: `agent-collab:${sessionId}`,
      content: session,
      meta: { type: 'agent_collab', sessionId },
    });

    return {
      session,
      honesty: { multiAgentOs: false, sandboxOnly: true },
      note: 'Sandbox collaboration transcript — not a distributed multi-agent OS.',
    };
  }

  async schedule(
    input: AuthCtx & { agentId?: string; goal?: string; runAt?: string },
  ) {
    this.assertEnabled();
    const agent = await this.requireAgent(input, input.agentId);
    await this.policy.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      agentId: agent.id,
      action: 'agent.schedule',
      permissions: agent.permissions,
    });
    const runAt = input.runAt ? new Date(input.runAt) : new Date(Date.now() + 3600_000);
    if (Number.isNaN(runAt.getTime())) {
      throw new ApiException('validation_error', 'runAt must be ISO datetime', HttpStatus.BAD_REQUEST);
    }
    const scheduleId = `sched_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const row = {
      id: scheduleId,
      agentId: agent.id,
      goal: (input.goal ?? agent.goal ?? 'scheduled sandbox goal').trim(),
      runAt: runAt.toISOString(),
      status: 'scheduled',
      sandbox: true,
      createdAt: new Date().toISOString(),
    };
    await this.writeRecord(input, {
      key: `agent-sched:${scheduleId}`,
      content: row,
      meta: { type: 'agent_schedule', agentId: agent.id, scheduleId },
    });
    return {
      schedule: row,
      honesty: { cronFleetOs: false },
      note: 'Schedule recorded — not an autonomous cron fleet OS. Execute later via /run.',
    };
  }

  async putMemory(
    input: AuthCtx & { agentId?: string; content?: string; kind?: string },
  ) {
    this.assertEnabled();
    const agent = await this.requireAgent(input, input.agentId);
    await this.policy.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      agentId: agent.id,
      action: 'memory.put',
      permissions: agent.permissions,
    });
    const content = (input.content ?? '').trim();
    if (!content) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    return this.memoryRuntime.put({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      scope: 'agent',
      kind: input.kind ?? 'long_term',
      content,
      agentId: agent.id,
    });
  }

  async marketplace(input: AuthCtx) {
    this.assertEnabled();
    const listings = await this.prisma.marketplaceListing.count({
      where: { publisherOrgId: input.organizationId, kind: 'agent' },
    });
    const published = await this.prisma.marketplaceListing.count({
      where: {
        publisherOrgId: input.organizationId,
        kind: 'agent',
        status: 'published',
      },
    });
    return {
      kind: 'agent',
      listings,
      published,
      api: 'GET /v1/marketplace?kind=agent',
      console: '/marketplace',
      note: 'Agent marketplace via existing listings when present.',
    };
  }

  async analytics(input: AuthCtx) {
    this.assertEnabled();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const actions = [
      'agent_runtime.agent_created',
      'agent_runtime.ran',
      'agent_runtime.lifecycle',
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
    const agents = await this.listAgents(input);
    return {
      periodStart: start.toISOString(),
      workspaceId: input.workspaceId,
      agentCount: agents.agents.length,
      events: counts.reduce((s, c) => s + c.count, 0),
      byAction: Object.fromEntries(counts.map((c) => [c.action, c.count])),
      honesty: agentRuntimeCatalog().honesty,
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

  private async executeSandboxed(
    input: AuthCtx,
    agent: AgentRecord,
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
          problem: String(payload.problem ?? agent.goal ?? 'plan'),
          sandboxOnly: true,
        });
      case 'reason.reason':
        return this.reasoningRuntime.reason({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          userId: input.userId,
          ip: input.ip,
          problem: String(payload.problem ?? agent.goal ?? 'reason'),
          strategy: typeof payload.strategy === 'string' ? payload.strategy : 'chain_of_thought',
          retrieve: false,
          persist: true,
        });
      case 'memory.put':
        return this.memoryRuntime.put({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          scope: 'agent',
          kind: 'long_term',
          content: String(payload.content ?? `agent ${agent.id} note`),
          agentId: agent.id,
        });
      case 'memory.search':
        return this.memoryRuntime.search({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          query: String(payload.query ?? agent.name),
          scope: 'agent',
        });
      case 'context.assemble':
        return this.contextRuntime.assemble({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          userId: input.userId,
          ip: input.ip,
          query: String(payload.query ?? agent.goal ?? ''),
          modelHint: `agent:${agent.id}`,
          maxChars: 2000,
          include: { documents: false, knowledgeGraph: false },
          useCache: false,
        });
      case 'tools.suggest':
        return this.reasoningRuntime.selectTools({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          userId: input.userId,
          ip: input.ip,
          problem: String(payload.problem ?? agent.goal ?? 'suggest tools'),
        });
      case 'agent.message':
        return {
          from: agent.id,
          body: String(payload.message ?? 'sandbox ping'),
          simulated: true,
        };
      case 'agent.schedule':
        return this.schedule({
          ...input,
          agentId: agent.id,
          goal: typeof payload.goal === 'string' ? payload.goal : agent.goal,
          runAt: typeof payload.runAt === 'string' ? payload.runAt : undefined,
        });
      default:
        throw new ApiException(
          'agent_policy_denied',
          `Unsupported sandbox action ${action}`,
          HttpStatus.FORBIDDEN,
        );
    }
  }

  private assertEnabled() {
    if (agentRuntimeMode() === 'disabled') {
      throw new ApiException(
        'agent_runtime_disabled',
        'Agent Runtime mode is disabled (LUGEMI_AGENT_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async requireAgent(input: AuthCtx, id?: string) {
    const agentId = (id ?? '').trim();
    if (!agentId) {
      throw new ApiException('validation_error', 'agent id is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        key: `agent:${agentId}`,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    const agent = row ? this.parseJson<AgentRecord>(row.content) : null;
    if (!agent?.id) {
      throw new ApiException('not_found', 'Agent not found', HttpStatus.NOT_FOUND);
    }
    return agent;
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

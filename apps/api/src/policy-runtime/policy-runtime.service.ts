import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  POLICY_GLOBAL_DENIES,
  POLICY_KINDS,
  PolicyKind,
  PolicyRuntimeTarget,
  policyRuntimeCatalog,
  policyRuntimeCeilings,
  policyRuntimeMode,
} from './policy-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

type PolicyRecord = {
  id: string;
  name: string;
  kind: PolicyKind;
  effect: 'deny' | 'allow';
  actions: string[];
  targets: PolicyRuntimeTarget[];
  enabled: boolean;
  region?: string;
  createdAt: string;
  updatedAt: string;
};

export type PolicyHardGateInput = {
  organizationId: string;
  workspaceId: string;
  runtime: Exclude<PolicyRuntimeTarget, '*'>;
  subjectId: string;
  action: string;
  permissions: string[];
};

const RUNTIME = 'policy-runtime';
const KERNEL_LAYER = 'kernel';

@Injectable()
export class PolicyRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...policyRuntimeCatalog(),
      ceilings: policyRuntimeCeilings(),
      mode: policyRuntimeMode(),
      safety: {
        hardGate: true,
        logOnlyForbidden: true,
        wiredIntoAgentWorkflowPlugin: true,
        note:
          'Policy Runtime is a hard gate. Agent/Workflow/Plugin call assertHardGate before actions — denies return 403, not logs.',
      },
    };
  }

  kinds() {
    return {
      kinds: POLICY_KINDS.map((id) => ({ id })),
      globalDenies: POLICY_GLOBAL_DENIES.map((id) => ({ id })),
      note: 'Policy kinds are declarative labels. Enforcement is always hard-gate.',
    };
  }

  /**
   * Hard gate used by Agent/Workflow/Plugin gates.
   * Throws ApiException 403 on deny — never log-only.
   */
  async assertHardGate(input: PolicyHardGateInput): Promise<{
    allowed: true;
    action: string;
    engine: 'policy-runtime';
    hardGate: true;
    policyIds: string[];
  }> {
    const decision = await this.evaluate({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      runtime: input.runtime,
      subjectId: input.subjectId,
      action: input.action,
      permissions: input.permissions,
    });

    if (!decision.allowed) {
      throw new ApiException(
        'policy_runtime_denied',
        decision.reason,
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      allowed: true,
      action: input.action,
      engine: 'policy-runtime',
      hardGate: true,
      policyIds: decision.matchedPolicyIds,
    };
  }

  async evaluate(
    input: AuthCtx & {
      runtime?: string;
      subjectId?: string;
      action?: string;
      permissions?: string[];
    },
  ) {
    const action = (input.action ?? '').trim();
    const runtime = (input.runtime ?? '*').trim() as PolicyRuntimeTarget | string;
    if (!action) {
      return {
        allowed: false,
        hardGate: true,
        logOnly: false,
        reason: 'action is required',
        matchedPolicyIds: [] as string[],
        engine: 'policy-runtime' as const,
      };
    }

    if ((POLICY_GLOBAL_DENIES as readonly string[]).includes(action)) {
      await this.auditDeny(input, action, runtime, 'global_deny', []);
      return {
        allowed: false,
        hardGate: true,
        logOnly: false,
        reason: `Action "${action}" is globally denied by Policy Runtime (hard gate).`,
        matchedPolicyIds: [] as string[],
        engine: 'policy-runtime' as const,
      };
    }

    // Even when mode=disabled, global denies above still apply.
    // Org policies apply only in enforce mode.
    if (policyRuntimeMode() === 'enforce') {
      const policies = await this.loadEnabledPolicies(input);
      const denyMatches = policies.filter(
        (p) =>
          p.effect === 'deny' &&
          p.actions.includes(action) &&
          (p.targets.includes('*') ||
            p.targets.includes(runtime as PolicyRuntimeTarget)),
      );
      if (denyMatches.length > 0) {
        const ids = denyMatches.map((p) => p.id);
        await this.auditDeny(input, action, runtime, 'org_deny', ids);
        return {
          allowed: false,
          hardGate: true,
          logOnly: false,
          reason: `Action "${action}" denied by organization policy ${ids[0]} (hard gate).`,
          matchedPolicyIds: ids,
          engine: 'policy-runtime' as const,
        };
      }
    }

    return {
      allowed: true,
      hardGate: true,
      logOnly: false,
      reason: 'allowed',
      matchedPolicyIds: [] as string[],
      runtime,
      subjectId: input.subjectId ?? null,
      engine: 'policy-runtime' as const,
      honesty: policyRuntimeCatalog().honesty,
    };
  }

  async createPolicy(
    input: AuthCtx & {
      name?: string;
      kind?: string;
      effect?: string;
      actions?: string[];
      targets?: string[];
      region?: string;
      enabled?: boolean;
    },
  ) {
    this.assertEnabledForMutations();
    const name = (input.name ?? '').trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const kind = (input.kind ?? 'security').trim() as PolicyKind;
    if (!POLICY_KINDS.includes(kind)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of ${POLICY_KINDS.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const effect = input.effect === 'allow' ? 'allow' : 'deny';
    if (effect === 'allow') {
      // Allow policies are recorded but hard-gate still requires runtime allowlists;
      // deny is the load-bearing enforcement path (README: hard gate).
    }
    const actions = Array.isArray(input.actions)
      ? input.actions.map((a) => String(a).trim()).filter(Boolean).slice(0, 50)
      : [];
    if (actions.length === 0) {
      throw new ApiException(
        'validation_error',
        'actions must include at least one action',
        HttpStatus.BAD_REQUEST,
      );
    }
    const targets = (
      Array.isArray(input.targets) && input.targets.length
        ? input.targets
        : ['*']
    )
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 10) as PolicyRuntimeTarget[];

    const ceilings = policyRuntimeCeilings();
    const existing = await this.listPolicies(input);
    if (existing.policies.length >= ceilings.maxPoliciesPerWorkspace) {
      throw new ApiException(
        'policy_runtime_ceiling',
        `Hard policy ceiling exceeded: ${existing.policies.length} >= maxPoliciesPerWorkspace ${ceilings.maxPoliciesPerWorkspace}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const now = new Date().toISOString();
    const policy: PolicyRecord = {
      id: `pol_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      name: name.slice(0, 80),
      kind,
      effect,
      actions,
      targets,
      enabled: input.enabled !== false,
      region: input.region?.trim().slice(0, 32) || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRecord(input, {
      key: `policy:${policy.id}`,
      content: policy,
      meta: { type: 'policy', policyId: policy.id, kind, effect, enabled: policy.enabled },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'policy_runtime.policy_created',
      route: 'POST /v1/policy-runtime/policies',
      ip: input.ip,
      metadata: { policyId: policy.id, effect, actions },
    });

    return {
      policy,
      honesty: policyRuntimeCatalog().honesty,
      note: 'Policy stored. Deny policies hard-block matching Agent/Workflow/Plugin actions.',
    };
  }

  async listPolicies(input: AuthCtx) {
    const rows = await this.findByType(input, 'policy', 100);
    const policies = rows
      .map((r) => this.parseJson<PolicyRecord>(r.content))
      .filter((p): p is PolicyRecord => Boolean(p?.id));
    return { policies, note: 'Workspace policies (kernel MemoryRecords).' };
  }

  async getPolicy(input: AuthCtx & { id?: string }) {
    const policy = await this.requirePolicy(input, input.id);
    return { policy };
  }

  async setEnabled(input: AuthCtx & { id?: string; enabled?: boolean }) {
    this.assertEnabledForMutations();
    const policy = await this.requirePolicy(input, input.id);
    policy.enabled = Boolean(input.enabled);
    policy.updatedAt = new Date().toISOString();
    await this.writeRecord(input, {
      key: `policy:${policy.id}`,
      content: policy,
      meta: {
        type: 'policy',
        policyId: policy.id,
        kind: policy.kind,
        effect: policy.effect,
        enabled: policy.enabled,
      },
      replaceKey: `policy:${policy.id}`,
    });
    return { policy, note: policy.enabled ? 'Policy enabled.' : 'Policy disabled.' };
  }

  async analytics(input: AuthCtx) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const actions = [
      'policy_runtime.policy_created',
      'policy_runtime.denied',
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
    const policies = await this.listPolicies(input);
    return {
      periodStart: start.toISOString(),
      workspaceId: input.workspaceId,
      policyCount: policies.policies.length,
      events: counts.reduce((s, c) => s + c.count, 0),
      byAction: Object.fromEntries(counts.map((c) => [c.action, c.count])),
      honesty: policyRuntimeCatalog().honesty,
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
      wiring: {
        agentRuntime: true,
        workflowRuntime: true,
        pluginRuntime: true,
        hardGate: true,
        logOnly: false,
      },
    };
  }

  private async loadEnabledPolicies(input: AuthCtx): Promise<PolicyRecord[]> {
    const listed = await this.listPolicies(input);
    return listed.policies.filter((p) => p.enabled);
  }

  private async auditDeny(
    input: AuthCtx,
    action: string,
    runtime: string,
    reasonCode: string,
    policyIds: string[],
  ) {
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'policy_runtime.denied',
      route: 'policy-runtime.assertHardGate',
      ip: input.ip,
      metadata: { action, runtime, reasonCode, policyIds, hardGate: true, logOnly: false },
    });
  }

  private assertEnabledForMutations() {
    if (policyRuntimeMode() === 'disabled') {
      throw new ApiException(
        'policy_runtime_disabled',
        'Policy Runtime mutations disabled (VERBALAB_POLICY_RUNTIME_MODE=disabled). Global hard denies still apply to runtime gates.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async requirePolicy(input: AuthCtx, id?: string) {
    const policyId = (id ?? '').trim();
    if (!policyId) {
      throw new ApiException('validation_error', 'policy id is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        key: `policy:${policyId}`,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    const policy = row ? this.parseJson<PolicyRecord>(row.content) : null;
    if (!policy?.id) {
      throw new ApiException('not_found', 'Policy not found', HttpStatus.NOT_FOUND);
    }
    return policy;
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

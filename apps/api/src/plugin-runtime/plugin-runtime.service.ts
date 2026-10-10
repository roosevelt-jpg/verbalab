import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemoryRuntimeService } from '../memory-runtime/memory-runtime.service';
import { ReasoningRuntimeService } from '../reasoning-runtime/reasoning-runtime.service';
import { ContextRuntimeService } from '../context-runtime/context-runtime.service';
import { ApiException } from '../common/errors/api-exception';
import { PluginPolicyGate } from './plugin-policy.gate';
import {
  PLUGIN_PERMISSIONS,
  pluginRuntimeCatalog,
  pluginRuntimeCeilings,
  pluginRuntimeMode,
} from './plugin-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type PluginRecord = {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'active' | 'paused' | 'archived';
  permissions: string[];
  dependencies: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
};

type InvokeStep = {
  action: string;
  allowed: boolean;
  simulated: boolean;
  result?: unknown;
  error?: string;
  at: string;
};

const RUNTIME = 'plugin-runtime';
const KERNEL_LAYER = 'kernel';

@Injectable()
export class PluginRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly policy: PluginPolicyGate,
    private readonly memoryRuntime: MemoryRuntimeService,
    private readonly reasoningRuntime: ReasoningRuntimeService,
    private readonly contextRuntime: ContextRuntimeService,
  ) {}

  engine() {
    return {
      ...pluginRuntimeCatalog(),
      ceilings: pluginRuntimeCeilings(),
      mode: pluginRuntimeMode(),
      safety: {
        scopedPermissionsRequired: true,
        sandboxRequired: true,
        openToolExecutionForbidden: true,
        liveCodeExecutionForbidden: true,
        policyMustHardGate: true,
        note:
          'Every plugin action passes PluginPolicyGate (local hard allowlist). Policy Runtime will harden further. Not a browser/VS Code extension OS.',
      },
    };
  }

  permissions() {
    return {
      grantable: PLUGIN_PERMISSIONS.map((id) => ({ id })),
      denied: pluginRuntimeCatalog().deniedActions,
      note: 'Only grantable permissions may be attached to a plugin. Denied actions cannot be granted.',
    };
  }

  async register(
    input: AuthCtx & {
      name?: string;
      permissions?: string[];
      dependencies?: string[];
      description?: string;
    },
  ) {
    this.assertEnabled();
    const name = (input.name ?? '').trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const ceilings = pluginRuntimeCeilings();
    const existing = await this.listPlugins(input);
    if (existing.plugins.length >= ceilings.maxPluginsPerWorkspace) {
      throw new ApiException(
        'plugin_runtime_ceiling',
        `Hard plugin ceiling exceeded: ${existing.plugins.length} >= maxPluginsPerWorkspace ${ceilings.maxPluginsPerWorkspace}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const deps = Array.isArray(input.dependencies)
      ? input.dependencies.map((d) => String(d).trim()).filter(Boolean).slice(0, 20)
      : [];
    for (const dep of deps) {
      await this.requirePlugin(input, dep);
    }

    const now = new Date().toISOString();
    const plugin: PluginRecord = {
      id: `plg_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      name: name.slice(0, 80),
      version: 1,
      status: 'draft',
      permissions: this.policy.normalizePermissions(input.permissions),
      dependencies: deps,
      description: input.description?.trim().slice(0, 500) || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeRecord(input, {
      key: `plugin:${plugin.id}`,
      content: plugin,
      meta: { type: 'plugin', pluginId: plugin.id, status: plugin.status, version: 1 },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'plugin_runtime.plugin_registered',
      route: 'POST /v1/plugin-runtime/plugins',
      ip: input.ip,
      metadata: { pluginId: plugin.id, permissions: plugin.permissions },
    });

    return {
      plugin,
      honesty: pluginRuntimeCatalog().honesty,
      note: 'Plugin registered in draft. Activate before invoke. Permissions are a hard allowlist.',
    };
  }

  async listPlugins(input: AuthCtx) {
    this.assertEnabled();
    const rows = await this.findByType(input, 'plugin', 100);
    const plugins = rows
      .map((r) => this.parseJson<PluginRecord>(r.content))
      .filter((p): p is PluginRecord => Boolean(p?.id));
    return { plugins, note: 'Workspace plugin registry (kernel MemoryRecords).' };
  }

  async getPlugin(input: AuthCtx & { id?: string }) {
    const plugin = await this.requirePlugin(input, input.id);
    return { plugin };
  }

  async lifecycle(input: AuthCtx & { id?: string; status?: string }) {
    this.assertEnabled();
    const plugin = await this.requirePlugin(input, input.id);
    const status = (input.status ?? '').trim() as PluginRecord['status'];
    if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
      throw new ApiException(
        'validation_error',
        'status must be draft|active|paused|archived',
        HttpStatus.BAD_REQUEST,
      );
    }
    plugin.status = status;
    plugin.updatedAt = new Date().toISOString();
    await this.writeRecord(input, {
      key: `plugin:${plugin.id}`,
      content: plugin,
      meta: {
        type: 'plugin',
        pluginId: plugin.id,
        status,
        version: plugin.version,
      },
      replaceKey: `plugin:${plugin.id}`,
    });
    return { plugin, note: 'Lifecycle updated.' };
  }

  async version(input: AuthCtx & { id?: string; description?: string }) {
    this.assertEnabled();
    const plugin = await this.requirePlugin(input, input.id);
    if (input.description !== undefined) {
      plugin.description = input.description.trim().slice(0, 500) || undefined;
    }
    plugin.version += 1;
    plugin.updatedAt = new Date().toISOString();
    await this.writeRecord(input, {
      key: `plugin:${plugin.id}`,
      content: plugin,
      meta: {
        type: 'plugin',
        pluginId: plugin.id,
        status: plugin.status,
        version: plugin.version,
      },
      replaceKey: `plugin:${plugin.id}`,
    });
    await this.writeRecord(input, {
      key: `plugin-version:${plugin.id}:v${plugin.version}`,
      content: { ...plugin },
      meta: { type: 'plugin_version', pluginId: plugin.id, version: plugin.version },
    });
    return { plugin, note: `Version bumped to ${plugin.version}.` };
  }

  async invoke(
    input: AuthCtx & {
      pluginId?: string;
      actions?: Array<{ action: string; input?: Record<string, unknown> }>;
      payload?: Record<string, unknown>;
    },
  ) {
    this.assertEnabled();
    const plugin = await this.requirePlugin(input, input.pluginId);
    if (plugin.status !== 'active') {
      throw new ApiException(
        'plugin_not_active',
        `Plugin must be active to invoke (status=${plugin.status})`,
        HttpStatus.FORBIDDEN,
      );
    }

    for (const dep of plugin.dependencies) {
      const depPlugin = await this.requirePlugin(input, dep);
      if (depPlugin.status !== 'active') {
        throw new ApiException(
          'plugin_dependency_inactive',
          `Dependency ${dep} is not active`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const ceilings = pluginRuntimeCeilings();
    const requested =
      input.actions?.length
        ? input.actions
        : [{ action: 'plugin.read', input: input.payload ?? {} }];

    if (requested.length > ceilings.maxInvokeSteps) {
      throw new ApiException(
        'plugin_runtime_ceiling',
        `Hard step ceiling exceeded: ${requested.length} > maxInvokeSteps ${ceilings.maxInvokeSteps}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const invokeId = `pinv_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const steps: InvokeStep[] = [];

    for (const step of requested) {
      const at = new Date().toISOString();
      try {
        const gate = await this.policy.assertAllowed({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          pluginId: plugin.id,
          action: step.action,
          permissions: plugin.permissions,
        });
        const result = await this.executeSandboxed(
          input,
          plugin,
          gate.action,
          step.input ?? {},
        );
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
        if (status === HttpStatus.FORBIDDEN) break;
      }
    }

    const denied = steps.some((s) => !s.allowed);
    const invocation = {
      id: invokeId,
      pluginId: plugin.id,
      version: plugin.version,
      status: denied ? 'denied' : 'completed',
      sandbox: true,
      liveCodeExecution: false,
      steps,
      createdAt: new Date().toISOString(),
    };

    await this.writeRecord(input, {
      key: `plugin-invoke:${invokeId}`,
      content: invocation,
      meta: {
        type: 'plugin_invoke',
        pluginId: plugin.id,
        invokeId,
        status: invocation.status,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'plugin_runtime.invoked',
      route: 'POST /v1/plugin-runtime/invoke',
      ip: input.ip,
      metadata: {
        invokeId,
        pluginId: plugin.id,
        steps: steps.length,
        denied,
      },
    });

    return {
      invocation,
      honesty: {
        ...pluginRuntimeCatalog().honesty,
        simulatedSteps: true,
      },
      note: denied
        ? 'Invoke stopped on hard permission/policy deny.'
        : 'Sandbox invoke completed — handlers simulated within allowlist; not live code execution.',
    };
  }

  async marketplace(input: AuthCtx) {
    this.assertEnabled();
    const listings = await this.prisma.marketplaceListing.count({
      where: { publisherOrgId: input.organizationId, kind: 'plugin' },
    });
    const published = await this.prisma.marketplaceListing.count({
      where: {
        publisherOrgId: input.organizationId,
        kind: 'plugin',
        status: 'published',
      },
    });
    return {
      kind: 'plugin',
      listings,
      published,
      api: 'GET /v1/plugin-marketplace/listings',
      console: '/plugin-marketplace',
      honesty: { regeneratesMarketplace: false, extendsMarketplace: true },
      note:
        'Listing counts for kind=plugin. Full publish/install/run lives at /v1/plugin-marketplace with sandbox + Policy gates.',
    };
  }

  async analytics(input: AuthCtx) {
    this.assertEnabled();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const actions = [
      'plugin_runtime.plugin_registered',
      'plugin_runtime.invoked',
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
    const plugins = await this.listPlugins(input);
    return {
      periodStart: start.toISOString(),
      workspaceId: input.workspaceId,
      pluginCount: plugins.plugins.length,
      events: counts.reduce((s, c) => s + c.count, 0),
      byAction: Object.fromEntries(counts.map((c) => [c.action, c.count])),
      honesty: pluginRuntimeCatalog().honesty,
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
    plugin: PluginRecord,
    action: string,
    payload: Record<string, unknown>,
  ) {
    switch (action) {
      case 'plugin.read':
        return {
          pluginId: plugin.id,
          name: plugin.name,
          version: plugin.version,
          payload,
          simulated: true,
        };
      case 'plugin.transform':
        return {
          pluginId: plugin.id,
          input: payload,
          output: {
            text: String(payload.text ?? payload.content ?? plugin.name)
              .trim()
              .slice(0, 500),
            transformed: true,
          },
          simulated: true,
        };
      case 'plugin.notify':
        return {
          channel: String(payload.channel ?? 'sandbox'),
          message: String(payload.message ?? `notify from ${plugin.name}`),
          simulated: true,
          delivered: false,
        };
      case 'reason.plan':
        return this.reasoningRuntime.plan({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          problem: String(payload.problem ?? plugin.name),
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
          content: String(payload.content ?? `plugin ${plugin.id} note`),
        });
      case 'memory.search':
        return this.memoryRuntime.search({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          query: String(payload.query ?? plugin.name),
          scope: 'workspace',
        });
      case 'context.assemble':
        return this.contextRuntime.assemble({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          userId: input.userId,
          ip: input.ip,
          query: String(payload.query ?? plugin.name),
          modelHint: `plugin:${plugin.id}`,
          maxChars: 2000,
          include: { documents: false, knowledgeGraph: false },
          useCache: false,
        });
      default:
        throw new ApiException(
          'plugin_policy_denied',
          `Unsupported sandbox action ${action}`,
          HttpStatus.FORBIDDEN,
        );
    }
  }

  private assertEnabled() {
    if (pluginRuntimeMode() === 'disabled') {
      throw new ApiException(
        'plugin_runtime_disabled',
        'Plugin Runtime mode is disabled (LUGEMI_PLUGIN_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async requirePlugin(input: AuthCtx, id?: string) {
    const pluginId = (id ?? '').trim();
    if (!pluginId) {
      throw new ApiException('validation_error', 'plugin id is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        key: `plugin:${pluginId}`,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    const plugin = row ? this.parseJson<PluginRecord>(row.content) : null;
    if (!plugin?.id) {
      throw new ApiException('not_found', 'Plugin not found', HttpStatus.NOT_FOUND);
    }
    return plugin;
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

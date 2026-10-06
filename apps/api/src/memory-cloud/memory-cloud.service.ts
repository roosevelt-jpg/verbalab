import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  MEMORY_KINDS,
  MEMORY_SCOPES,
  MemoryKind,
  MemoryScope,
  memoryCloudCatalog,
} from './memory-cloud.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  role?: string;
  ip?: string;
};

@Injectable()
export class MemoryCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return memoryCloudCatalog();
  }

  scopes() {
    return {
      scopes: MEMORY_SCOPES.map((id) => ({
        id,
        notes:
          id === 'organization'
            ? 'Org-scoped facts still stored on a workspace row for residency.'
            : id === 'agent'
              ? 'Requires agentId. Full agent OS deferred.'
              : undefined,
      })),
      kinds: MEMORY_KINDS.map((id) => ({ id })),
      note: 'Memory scopes and kinds for writes.',
    };
  }

  private assertScope(scope: string): MemoryScope {
    if (!(MEMORY_SCOPES as readonly string[]).includes(scope)) {
      throw new ApiException(
        'validation_error',
        `scope must be one of: ${MEMORY_SCOPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return scope as MemoryScope;
  }

  private assertKind(kind: string): MemoryKind {
    if (!(MEMORY_KINDS as readonly string[]).includes(kind)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of: ${MEMORY_KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return kind as MemoryKind;
  }

  private activeWhere(
    organizationId: string,
    workspaceId: string,
    extra: Prisma.MemoryRecordWhereInput = {},
  ): Prisma.MemoryRecordWhereInput {
    return {
      organizationId,
      workspaceId,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...extra,
    };
  }

  private serialize(row: {
    id: string;
    organizationId: string;
    workspaceId: string;
    subjectUserId: string | null;
    agentId: string | null;
    projectKey: string | null;
    conversationId: string | null;
    scope: string;
    kind: string;
    key: string | null;
    content: string;
    metadata: Prisma.JsonValue;
    version: number;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      workspaceId: row.workspaceId,
      subjectUserId: row.subjectUserId,
      agentId: row.agentId,
      projectKey: row.projectKey,
      conversationId: row.conversationId,
      scope: row.scope,
      kind: row.kind,
      key: row.key,
      content: row.content,
      metadata: row.metadata,
      version: row.version,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    input: AuthCtx & {
      scope: string;
      kind: string;
      content: string;
      key?: string;
      subjectUserId?: string;
      agentId?: string;
      projectKey?: string;
      conversationId?: string;
      metadata?: Record<string, unknown>;
      expiresAt?: string | null;
      ttlSeconds?: number;
    },
  ) {
    const scope = this.assertScope(input.scope);
    const kind = this.assertKind(input.kind);
    const content = input.content?.trim();
    if (!content) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    if (scope === 'conversation' && !input.conversationId?.trim()) {
      throw new ApiException(
        'validation_error',
        'conversationId is required for scope=conversation',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (scope === 'project' && !input.projectKey?.trim()) {
      throw new ApiException(
        'validation_error',
        'projectKey is required for scope=project',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (scope === 'agent' && !input.agentId?.trim()) {
      throw new ApiException(
        'validation_error',
        'agentId is required for scope=agent',
        HttpStatus.BAD_REQUEST,
      );
    }

    let expiresAt: Date | null = null;
    if (input.expiresAt) {
      const parsed = new Date(input.expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new ApiException('validation_error', 'expiresAt must be ISO date', HttpStatus.BAD_REQUEST);
      }
      expiresAt = parsed;
    } else if (typeof input.ttlSeconds === 'number' && Number.isFinite(input.ttlSeconds)) {
      expiresAt = new Date(Date.now() + Math.max(1, input.ttlSeconds) * 1000);
    } else if (kind === 'short_term') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const row = await this.prisma.memoryRecord.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        subjectUserId: input.subjectUserId?.trim() || input.userId || null,
        agentId: input.agentId?.trim() || null,
        projectKey: input.projectKey?.trim() || null,
        conversationId: input.conversationId?.trim() || null,
        scope,
        kind,
        key: input.key?.trim() || null,
        content,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_cloud.created',
      route: 'POST /v1/memory-cloud/memories',
      ip: input.ip,
      metadata: { id: row.id, scope, kind },
    });

    return this.serialize(row);
  }

  async list(
    input: AuthCtx & {
      scope?: string;
      kind?: string;
      subjectUserId?: string;
      conversationId?: string;
      projectKey?: string;
      agentId?: string;
      limit?: number;
    },
  ) {
    const take = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.activeWhere(input.organizationId, input.workspaceId, {
        ...(input.scope ? { scope: this.assertScope(input.scope) } : {}),
        ...(input.kind ? { kind: this.assertKind(input.kind) } : {}),
        ...(input.subjectUserId ? { subjectUserId: input.subjectUserId } : {}),
        ...(input.conversationId ? { conversationId: input.conversationId } : {}),
        ...(input.projectKey ? { projectKey: input.projectKey } : {}),
        ...(input.agentId ? { agentId: input.agentId } : {}),
      }),
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { data: rows.map((r) => this.serialize(r)), note: 'Active non-deleted non-expired memories.' };
  }

  async get(input: AuthCtx & { id: string }) {
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'memory not found', HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async revise(input: AuthCtx & { id: string; content: string; metadata?: Record<string, unknown> }) {
    const content = input.content?.trim();
    if (!content) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    const existing = await this.prisma.memoryRecord.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'memory not found', HttpStatus.NOT_FOUND);
    }

    const row = await this.prisma.memoryRecord.update({
      where: { id: existing.id },
      data: {
        content,
        version: existing.version + 1,
        ...(input.metadata
          ? { metadata: input.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_cloud.revised',
      route: 'POST /v1/memory-cloud/memories/:id/revise',
      ip: input.ip,
      metadata: { id: row.id, version: row.version },
    });

    return this.serialize(row);
  }

  async search(
    input: AuthCtx & {
      query: string;
      scope?: string;
      kind?: string;
      subjectUserId?: string;
      limit?: number;
    },
  ) {
    const query = input.query?.trim();
    if (!query) {
      throw new ApiException('validation_error', 'query is required', HttpStatus.BAD_REQUEST);
    }
    const take = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.activeWhere(input.organizationId, input.workspaceId, {
        content: { contains: query, mode: 'insensitive' },
        ...(input.scope ? { scope: this.assertScope(input.scope) } : {}),
        ...(input.kind ? { kind: this.assertKind(input.kind) } : {}),
        ...(input.subjectUserId ? { subjectUserId: input.subjectUserId } : {}),
      }),
      orderBy: { updatedAt: 'desc' },
      take,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_cloud.searched',
      route: 'POST /v1/memory-cloud/search',
      ip: input.ip,
      metadata: { hits: rows.length, queryLength: query.length },
    });

    return {
      query,
      hits: rows.map((r) => this.serialize(r)),
      note: 'Text contains search. Embedding/NN semantic memory deferred.',
    };
  }

  async export(input: AuthCtx & { subjectUserId?: string }) {
    const where: Prisma.MemoryRecordWhereInput = {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      deletedAt: null,
      ...(input.subjectUserId ? { subjectUserId: input.subjectUserId } : {}),
    };

    const rows = await this.prisma.memoryRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_cloud.exported',
      route: 'POST /v1/memory-cloud/export',
      ip: input.ip,
      metadata: {
        count: rows.length,
        subjectUserId: input.subjectUserId ?? null,
        workspaceId: input.workspaceId,
      },
    });

    return {
      exportedAt: new Date().toISOString(),
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      subjectUserId: input.subjectUserId ?? null,
      count: rows.length,
      memories: rows.map((r) => this.serialize(r)),
      note: 'GDPR-style memory export. Includes soft-active rows only.',
    };
  }

  async erase(
    input: AuthCtx & {
      subjectUserId?: string;
      confirm: boolean;
      hard?: boolean;
    },
  ) {
    if (!input.confirm) {
      throw new ApiException(
        'validation_error',
        'confirm must be true to erase memories',
        HttpStatus.BAD_REQUEST,
      );
    }

    const where: Prisma.MemoryRecordWhereInput = {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      deletedAt: null,
      ...(input.subjectUserId ? { subjectUserId: input.subjectUserId } : {}),
    };

    const matching = await this.prisma.memoryRecord.findMany({
      where,
      select: { id: true },
    });

    if (input.hard === false) {
      await this.prisma.memoryRecord.updateMany({
        where,
        data: { deletedAt: new Date() },
      });
    } else {
      await this.prisma.memoryRecord.deleteMany({ where });
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_cloud.erased',
      route: 'POST /v1/memory-cloud/erase',
      ip: input.ip,
      metadata: {
        count: matching.length,
        subjectUserId: input.subjectUserId ?? null,
        hard: input.hard !== false,
      },
    });

    return {
      erased: true,
      count: matching.length,
      subjectUserId: input.subjectUserId ?? null,
      hard: input.hard !== false,
      note: 'GDPR right-to-be-forgotten for Memory Cloud.',
    };
  }

  async deleteOne(input: AuthCtx & { id: string }) {
    const existing = await this.prisma.memoryRecord.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new ApiException('not_found', 'memory not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.memoryRecord.delete({ where: { id: existing.id } });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_cloud.deleted',
      route: 'DELETE /v1/memory-cloud/memories/:id',
      ip: input.ip,
      metadata: { id: existing.id },
    });

    return { deleted: true, id: existing.id };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const [active, byScope, byKind, writes, exports, erases] = await Promise.all([
      this.prisma.memoryRecord.count({
        where: this.activeWhere(organizationId, workspaceId),
      }),
      this.prisma.memoryRecord.groupBy({
        by: ['scope'],
        where: this.activeWhere(organizationId, workspaceId),
        _count: { _all: true },
      }),
      this.prisma.memoryRecord.groupBy({
        by: ['kind'],
        where: this.activeWhere(organizationId, workspaceId),
        _count: { _all: true },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'memory_cloud.created',
          createdAt: { gte: start },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'memory_cloud.exported',
          createdAt: { gte: start },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'memory_cloud.erased',
          createdAt: { gte: start },
        },
      }),
    ]);

    return {
      periodStart: start.toISOString(),
      activeMemories: active,
      byScope: byScope.map((r) => ({ scope: r.scope, count: r._count._all })),
      byKind: byKind.map((r) => ({ kind: r.kind, count: r._count._all })),
      writes,
      exports,
      erases,
      note: 'Memory Cloud analytics. Retention sweeper not automated.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const [analytics, engine] = await Promise.all([
      this.analytics(organizationId, workspaceId),
      Promise.resolve(this.engine()),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      periodStart: analytics.periodStart,
      activeMemories: analytics.activeMemories,
      writes: analytics.writes,
      exports: analytics.exports,
      erases: analytics.erases,
      gdprExport: engine.honesty.gdprExport,
      gdprErase: engine.honesty.gdprErase,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Memory Cloud monitoring snapshot.',
    };
  }

  /** Used by org-level governance export. */
  async listForWorkspaceExport(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: { organizationId, workspaceId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.serialize(r));
  }
}

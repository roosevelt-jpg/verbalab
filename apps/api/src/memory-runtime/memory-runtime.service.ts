import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCloudService } from '../memory-cloud/memory-cloud.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  KERNEL_MEMORY_KINDS,
  KERNEL_MEMORY_LAYER,
  KERNEL_MEMORY_SCOPES,
  KernelMemoryKind,
  KernelMemoryScope,
  memoryRuntimeCatalog,
  memoryRuntimeCeilings,
  memoryRuntimeMode,
} from './memory-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

@Injectable
export class MemoryRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryCloud: MemoryCloudService,
    private readonly audit: AuditService,
  ) {}

  engine {
    return {
      ...memoryRuntimeCatalog,
      ceilings: memoryRuntimeCeilings,
      mode: memoryRuntimeMode,
      safety: {
        agentActionBoundariesRequired: true,
        note:
          'Kernel memory is org/workspace-scoped. Agent memory writes require agentId; Agent Runtime writes via /v1/agent-runtime/memory.',
      },
    };
  }

  scopes {
    return {
      scopes: KERNEL_MEMORY_SCOPES.map((id) => ({ id })),
      kinds: KERNEL_MEMORY_KINDS.map((id) => ({ id })),
      layer: KERNEL_MEMORY_LAYER,
      note: 'Memory Runtime scopes map onto Memory Cloud storage.',
      honesty: memoryRuntimeCatalog.honesty,
    };
  }

  ceilings {
    return memoryRuntimeCeilings;
  }

  async put(
    input: AuthCtx & {
      scope?: string;
      kind?: string;
      content?: string;
      key?: string;
      conversationId?: string;
      agentId?: string;
      subjectUserId?: string;
      ttlSec?: number;
      encrypt?: boolean;
      metadata?: Record<string, unknown>;
    },
  ) {
    this.assertEnabled;
    const scope = this.assertScope(input.scope ?? 'workspace');
    const kind = this.assertKind(input.kind ?? 'short_term');
    let content = (input.content ?? '').trim;
    if (!content) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }

    const ceilings = memoryRuntimeCeilings;
    await this.purgeExpired(input);
    await this.enforceCeiling(input, ceilings.maxEntriesPerWorkspace);

    const encrypted = Boolean(input.encrypt);
    if (encrypted) {
      content = Buffer.from(content, 'utf8').toString('base64');
    }

    const ttlSec =
      kind === 'short_term'
        ? Math.min(
            ceilings.defaultShortTermTtlSec * 2,
            Math.max(30, Math.floor(input.ttlSec ?? ceilings.defaultShortTermTtlSec)),
          )
        : input.ttlSec
          ? Math.max(30, Math.floor(input.ttlSec))
          : undefined;

    const created = await this.memoryCloud.create({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      scope,
      kind,
      content,
      key: input.key,
      conversationId: input.conversationId,
      agentId: input.agentId,
      subjectUserId: input.subjectUserId,
      ttlSeconds: ttlSec,
      metadata: {
        ...(input.metadata ?? {}),
        layer: KERNEL_MEMORY_LAYER,
        encrypted,
        runtime: 'memory-runtime',
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_runtime.put',
      route: 'POST /v1/memory-runtime/put',
      ip: input.ip,
      metadata: { id: created.id, scope, kind, encrypted },
    });

    return {
      memory: created,
      honesty: { encryptionKmsOs: false, extendsMemoryCloud: true },
      note: encrypted
        ? 'Stored with sandbox base64 encrypt tag — not KMS/HSM OS.'
        : 'Kernel-layer MemoryRecord via Memory Cloud.',
    };
  }

  async list(input: AuthCtx & { scope?: string; kind?: string; limit?: number }) {
    this.assertEnabled;
    await this.purgeExpired(input);
    const take = Math.min(100, Math.max(1, input.limit ?? 50));
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input, {
        ...(input.scope ? { scope: input.scope } : {}),
        ...(input.kind ? { kind: input.kind } : {}),
      }),
      orderBy: { updatedAt: 'desc' },
      take,
    });
    return {
      memories: rows.map((r) => this.serialize(r)),
      note: 'Kernel-layer MemoryRecords (metadata.layer=kernel).',
    };
  }

  async search(input: AuthCtx & { query?: string; scope?: string; kind?: string; limit?: number }) {
    this.assertEnabled;
    const q = (input.query ?? '').trim;
    if (!q) {
      throw new ApiException('validation_error', 'query is required', HttpStatus.BAD_REQUEST);
    }
    const take = Math.min(50, Math.max(1, input.limit ?? 20));
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input, {
        content: { contains: q, mode: 'insensitive' },
        ...(input.scope ? { scope: input.scope } : {}),
        ...(input.kind ? { kind: input.kind } : {}),
      }),
      orderBy: { updatedAt: 'desc' },
      take,
    });
    return {
      query: q,
      results: rows.map((r) => this.serialize(r)),
      honesty: { vectorSemanticOs: false },
      note: 'Text contains search — not embedding ANN semantic OS.',
    };
  }

  async revise(input: AuthCtx & { id?: string; content?: string }) {
    this.assertEnabled;
    const id = (input.id ?? '').trim;
    const content = (input.content ?? '').trim;
    if (!id || !content) {
      throw new ApiException(
        'validation_error',
        'id and content are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.requireKernelRow(input, id);
    const revised = await this.memoryCloud.revise({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      id,
      content,
      metadata: { layer: KERNEL_MEMORY_LAYER, runtime: 'memory-runtime' },
    });
    return { memory: revised, note: 'Version bumped via Memory Cloud revise.' };
  }

  async compress(input: AuthCtx & { id?: string; maxChars?: number }) {
    this.assertEnabled;
    const id = (input.id ?? '').trim;
    if (!id) {
      throw new ApiException('validation_error', 'id is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.requireKernelRow(input, id);
    const maxChars = Math.min(4000, Math.max(40, Math.floor(input.maxChars ?? 280)));
    const raw = this.decodeContent(row);
    const compressed =
      raw.length <= maxChars
        ? raw
        : `${raw.slice(0, Math.max(0, maxChars - 16)).trim}…[compressed]`;
    const revised = await this.memoryCloud.revise({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      id,
      content: this.metaOf(row).encrypted
        ? Buffer.from(compressed, 'utf8').toString('base64')
        : compressed,
      metadata: {
        ...this.metaOf(row),
        layer: KERNEL_MEMORY_LAYER,
        compressed: true,
        maxChars,
      },
    });
    return {
      memory: revised,
      beforeChars: raw.length,
      afterChars: compressed.length,
      note: 'Heuristic truncation — not ML context-compression OS.',
    };
  }

  async evict(input: AuthCtx & { policy?: string }) {
    this.assertEnabled;
    const policy = (input.policy ?? 'ttl_and_ceiling').toLowerCase;
    const ceilings = memoryRuntimeCeilings;
    const purged = await this.purgeExpired(input);

    const active = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input),
      orderBy: { updatedAt: 'asc' },
      select: { id: true },
    });

    let deletedForCeiling = 0;
    if (active.length > ceilings.maxEntriesPerWorkspace) {
      const overflow = active.length - ceilings.maxEntriesPerWorkspace;
      const toDelete = active.slice(0, overflow).map((r) => r.id);
      const res = await this.prisma.memoryRecord.updateMany({
        where: {
          id: { in: toDelete },
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
        data: { deletedAt: new Date },
      });
      deletedForCeiling = res.count;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'memory_runtime.evicted',
      route: 'POST /v1/memory-runtime/evict',
      ip: input.ip,
      metadata: { policy, purged, deletedForCeiling },
    });

    return {
      policy,
      purgedExpired: purged,
      deletedForCeiling,
      ceilings,
      note: 'Eviction applied (TTL + ceiling). Not a distributed cache OS.',
    };
  }

  async sync(input: AuthCtx) {
    this.assertEnabled;
    const stamp = new Date.toISOString;
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input),
      take: 500,
    });
    let updated = 0;
    for (const row of rows) {
      const meta = this.metaOf(row);
      await this.prisma.memoryRecord.update({
        where: { id: row.id },
        data: {
          metadata: { ...meta, layer: KERNEL_MEMORY_LAYER, lastSyncAt: stamp } as Prisma.InputJsonValue,
        },
      });
      updated += 1;
    }
    return {
      synced: updated,
      stamp,
      honesty: { replicationOs: false },
      note: 'Sandbox sync stamp — not multi-region replication OS.',
    };
  }

  async createSnapshot(input: AuthCtx & { label?: string }) {
    this.assertEnabled;
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input),
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    const payload = {
      label: (input.label ?? 'snapshot').slice(0, 64),
      capturedAt: new Date.toISOString,
      count: rows.length,
      memories: rows.map((r) => this.serialize(r)),
    };
    const created = await this.memoryCloud.create({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      scope: 'workspace',
      kind: 'long_term',
      key: `kernel:snapshot:${Date.now}`,
      content: JSON.stringify(payload),
      metadata: {
        layer: KERNEL_MEMORY_LAYER,
        snapshot: true,
        runtime: 'memory-runtime',
        label: payload.label,
      },
    });
    return {
      snapshot: { id: created.id, label: payload.label, count: payload.count },
      note: 'Sandbox snapshot stored as kernel MemoryRecord — not backup appliance OS.',
    };
  }

  async listSnapshots(input: AuthCtx) {
    this.assertEnabled;
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input, {
        // filter snapshot in code via metadata
      }),
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const snapshots = rows
      .filter((r) => this.metaOf(r).snapshot === true)
      .map((r) => ({
        id: r.id,
        label: String(this.metaOf(r).label ?? 'snapshot'),
        createdAt: r.createdAt.toISOString,
        key: r.key,
      }));
    return { snapshots, note: 'Kernel memory snapshots.' };
  }

  async analytics(input: AuthCtx) {
    this.assertEnabled;
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input),
      select: { scope: true, kind: true },
      take: 5000,
    });
    const byScope: Record<string, number> = {};
    const byKind: Record<string, number> = {};
    for (const r of rows) {
      byScope[r.scope] = (byScope[r.scope] ?? 0) + 1;
      byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    }
    return {
      total: rows.length,
      byScope,
      byKind,
      ceilings: memoryRuntimeCeilings,
      honesty: memoryRuntimeCatalog.honesty,
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics] = await Promise.all([
      Promise.resolve(this.engine),
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

  private assertEnabled {
    if (memoryRuntimeMode === 'disabled') {
      throw new ApiException(
        'memory_runtime_disabled',
        'Memory Runtime mode is disabled (LUGEMI_MEMORY_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertScope(raw: string): KernelMemoryScope {
    const s = raw.trim.toLowerCase as KernelMemoryScope;
    if (!(KERNEL_MEMORY_SCOPES as readonly string[]).includes(s)) {
      throw new ApiException(
        'validation_error',
        `scope must be one of ${KERNEL_MEMORY_SCOPES.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return s;
  }

  private assertKind(raw: string): KernelMemoryKind {
    const k = raw.trim.toLowerCase as KernelMemoryKind;
    if (!(KERNEL_MEMORY_KINDS as readonly string[]).includes(k)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of ${KERNEL_MEMORY_KINDS.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return k;
  }

  private metaOf(row: { metadata: Prisma.JsonValue }): Record<string, unknown> {
    return row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  }

  private kernelWhere(
    input: AuthCtx,
    extra: Prisma.MemoryRecordWhereInput = {},
  ): Prisma.MemoryRecordWhereInput {
    return {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date } }],
      metadata: { path: ['layer'], equals: KERNEL_MEMORY_LAYER },
      ...extra,
    };
  }

  private async requireKernelRow(input: AuthCtx, id: string) {
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
    });
    if (!row || this.metaOf(row).layer !== KERNEL_MEMORY_LAYER) {
      throw new ApiException('not_found', 'Kernel memory not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private decodeContent(row: { content: string; metadata: Prisma.JsonValue }) {
    if (this.metaOf(row).encrypted) {
      try {
        return Buffer.from(row.content, 'base64').toString('utf8');
      } catch {
        return row.content;
      }
    }
    return row.content;
  }

  private serialize(row: {
    id: string;
    organizationId: string;
    workspaceId: string;
    subjectUserId: string | null;
    agentId: string | null;
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
    const meta = this.metaOf(row);
    return {
      id: row.id,
      organizationId: row.organizationId,
      workspaceId: row.workspaceId,
      scope: row.scope,
      kind: row.kind,
      key: row.key,
      content: meta.snapshot ? '[snapshot]' : this.decodeContent(row),
      encrypted: Boolean(meta.encrypted),
      snapshot: Boolean(meta.snapshot),
      version: row.version,
      agentId: row.agentId,
      conversationId: row.conversationId,
      subjectUserId: row.subjectUserId,
      expiresAt: row.expiresAt?.toISOString ?? null,
      createdAt: row.createdAt.toISOString,
      updatedAt: row.updatedAt.toISOString,
    };
  }

  private async purgeExpired(input: AuthCtx) {
    const res = await this.prisma.memoryRecord.updateMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        expiresAt: { lte: new Date },
        metadata: { path: ['layer'], equals: KERNEL_MEMORY_LAYER },
      },
      data: { deletedAt: new Date },
    });
    return res.count;
  }

  private async enforceCeiling(input: AuthCtx, max: number) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: this.kernelWhere(input),
      select: { id: true, metadata: true },
      take: max + 50,
    });
    const active = rows.filter((r) => this.metaOf(r).snapshot !== true).length;
    if (active >= max) {
      throw new ApiException(
        'memory_runtime_ceiling',
        `Hard kernel memory ceiling exceeded: active ${active} >= maxEntriesPerWorkspace ${max}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }
}


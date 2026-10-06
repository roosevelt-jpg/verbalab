import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryCloudService } from '../memory-cloud/memory-cloud.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  KNOWLEDGE_MEMORY_LAYER,
  KNOWLEDGE_MEMORY_SCOPES,
  KmScope,
  knowledgeMemoryCatalog,
} from './knowledge-memory.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type EvolutionEntry = {
  version: number;
  content: string;
  reason: string;
  at: string;
};

@Injectable
export class KnowledgeMemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryCloud: MemoryCloudService,
    private readonly audit: AuditService,
  ) {}

  engine {
    return knowledgeMemoryCatalog;
  }

  scopes {
    return {
      scopes: KNOWLEDGE_MEMORY_SCOPES.map((id) => ({
        id,
        mapsTo:
          id === 'user'
            ? 'memory-cloud scope=workspace + subjectUserId'
            : id === 'ai'
              ? 'memory-cloud scope=workspace|agent'
              : `memory-cloud scope=${id}`,
      })),
      layer: KNOWLEDGE_MEMORY_LAYER,
      note: 'Knowledge Memory scopes map onto Memory Cloud storage.',
    };
  }

  private assertScope(scope: string): KmScope {
    if (!(KNOWLEDGE_MEMORY_SCOPES as readonly string[]).includes(scope)) {
      throw new ApiException(
        'validation_error',
        `scope must be one of: ${KNOWLEDGE_MEMORY_SCOPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return scope as KmScope;
  }

  private metaOf(row: { metadata: Prisma.JsonValue }): Record<string, unknown> {
    return row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  }

  private isKnowledgeLayer(row: { metadata: Prisma.JsonValue }): boolean {
    return this.metaOf(row).layer === KNOWLEDGE_MEMORY_LAYER;
  }

  private mapScope(scope: KmScope): {
    memoryScope: string;
    requireSubject: boolean;
    requireConversation: boolean;
    preferAgent: boolean;
  } {
    switch (scope) {
      case 'organization':
        return {
          memoryScope: 'organization',
          requireSubject: false,
          requireConversation: false,
          preferAgent: false,
        };
      case 'workspace':
        return {
          memoryScope: 'workspace',
          requireSubject: false,
          requireConversation: false,
          preferAgent: false,
        };
      case 'user':
        return {
          memoryScope: 'workspace',
          requireSubject: true,
          requireConversation: false,
          preferAgent: false,
        };
      case 'conversation':
        return {
          memoryScope: 'conversation',
          requireSubject: false,
          requireConversation: true,
          preferAgent: false,
        };
      case 'ai':
        return {
          memoryScope: 'workspace',
          requireSubject: false,
          requireConversation: false,
          preferAgent: true,
        };
    }
  }

  private present(row: {
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
    const meta = this.metaOf(row);
    const kmScope = typeof meta.kmScope === 'string' ? meta.kmScope : row.scope;
    return {
      id: row.id,
      organizationId: row.organizationId,
      workspaceId: row.workspaceId,
      scope: kmScope,
      memoryCloudScope: row.scope,
      kind: row.kind,
      key: row.key,
      content: row.content,
      subjectUserId: row.subjectUserId,
      agentId: row.agentId,
      conversationId: row.conversationId,
      documentId: typeof meta.documentId === 'string' ? meta.documentId : null,
      version: row.version,
      evolutionCount: Array.isArray(meta.evolution) ? meta.evolution.length : 0,
      metadata: meta,
      expiresAt: row.expiresAt?.toISOString ?? null,
      createdAt: row.createdAt.toISOString,
      updatedAt: row.updatedAt.toISOString,
      layer: KNOWLEDGE_MEMORY_LAYER,
    };
  }

  private async loadKnowledge(input: AuthCtx & { id: string }) {
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
    });
    if (!row || !this.isKnowledgeLayer(row)) {
      throw new ApiException('not_found', 'Knowledge memory not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  async create(
    input: AuthCtx & {
      scope?: string;
      kind?: string;
      content?: string;
      key?: string;
      subjectUserId?: string;
      agentId?: string;
      conversationId?: string;
      documentId?: string;
      metadata?: Record<string, unknown>;
      expiresAt?: string | null;
      ttlSeconds?: number;
    },
  ) {
    const kmScope = this.assertScope(input.scope ?? 'workspace');
    const mapped = this.mapScope(kmScope);
    const content = input.content?.trim;
    if (!content) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }

    const subjectUserId = input.subjectUserId?.trim || input.userId;
    if (mapped.requireSubject && !subjectUserId) {
      throw new ApiException(
        'validation_error',
        'subjectUserId is required for scope=user',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (mapped.requireConversation && !input.conversationId?.trim) {
      throw new ApiException(
        'validation_error',
        'conversationId is required for scope=conversation',
        HttpStatus.BAD_REQUEST,
      );
    }

    let documentId: string | undefined;
    if (input.documentId?.trim) {
      const doc = await this.prisma.knowledgeDocument.findFirst({
        where: {
          id: input.documentId.trim,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      });
      if (!doc) {
        throw new ApiException(
          'not_found',
          'Knowledge document not found',
          HttpStatus.NOT_FOUND,
        );
      }
      documentId = doc.id;
    }

    const memoryScope =
      mapped.preferAgent && input.agentId?.trim ? 'agent' : mapped.memoryScope;

    const metadata: Record<string, unknown> = {
      ...(input.metadata ?? {}),
      layer: KNOWLEDGE_MEMORY_LAYER,
      kmScope,
      ...(documentId ? { documentId } : {}),
      evolution: [],
    };

    const created = await this.memoryCloud.create({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
      scope: memoryScope,
      kind: input.kind?.trim || 'long_term',
      content,
      key: input.key?.trim || undefined,
      subjectUserId,
      agentId: input.agentId,
      conversationId: input.conversationId,
      metadata,
      expiresAt: input.expiresAt,
      ttlSeconds: input.ttlSeconds,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_memory.created',
      route: 'POST /v1/knowledge-memory/memories',
      ip: input.ip,
      metadata: { id: created.id, kmScope, documentId: documentId ?? null },
    });

    const row = await this.loadKnowledge({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: created.id,
    });
    return this.present(row);
  }

  async list(
    input: AuthCtx & {
      scope?: string;
      subjectUserId?: string;
      conversationId?: string;
      documentId?: string;
      limit?: number;
    },
  ) {
    const take = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date } }],
        ...(input.subjectUserId ? { subjectUserId: input.subjectUserId } : {}),
        ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(take * 3, 300),
    });

    let filtered = rows.filter((r) => this.isKnowledgeLayer(r));
    if (input.scope) {
      const scope = this.assertScope(input.scope);
      filtered = filtered.filter((r) => this.metaOf(r).kmScope === scope);
    }
    if (input.documentId) {
      filtered = filtered.filter((r) => this.metaOf(r).documentId === input.documentId);
    }

    return {
      data: filtered.slice(0, take).map((r) => this.present(r)),
      note: 'Knowledge-layer memories only (metadata.layer=knowledge).',
    };
  }

  async get(input: AuthCtx & { id: string }) {
    const row = await this.loadKnowledge(input);
    return this.present(row);
  }

  async evolve(
    input: AuthCtx & { id: string; content?: string; reason?: string },
  ) {
    const content = input.content?.trim;
    if (!content) {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    const existing = await this.loadKnowledge(input);
    const meta = this.metaOf(existing);
    const prior: EvolutionEntry[] = Array.isArray(meta.evolution)
      ? (meta.evolution as EvolutionEntry[])
      : [];
    const entry: EvolutionEntry = {
      version: existing.version,
      content: existing.content,
      reason: input.reason?.trim || 'evolve',
      at: new Date.toISOString,
    };
    const nextMeta = {
      ...meta,
      layer: KNOWLEDGE_MEMORY_LAYER,
      evolution: [...prior, entry].slice(-50),
    };

    const revised = await this.memoryCloud.revise({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      id: existing.id,
      content,
      metadata: nextMeta,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_memory.evolved',
      route: 'POST /v1/knowledge-memory/memories/:id/evolve',
      ip: input.ip,
      metadata: { id: revised.id, version: revised.version },
    });

    const row = await this.loadKnowledge({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: revised.id,
    });
    return this.present(row);
  }

  async versions(input: AuthCtx & { id: string }) {
    const row = await this.loadKnowledge(input);
    const meta = this.metaOf(row);
    const history: EvolutionEntry[] = Array.isArray(meta.evolution)
      ? (meta.evolution as EvolutionEntry[])
      : [];
    return {
      id: row.id,
      currentVersion: row.version,
      currentContent: row.content,
      history,
      note: 'Bounded evolution trail — not a full knowledge VCS.',
    };
  }

  async search(
    input: AuthCtx & { query?: string; scope?: string; documentId?: string; limit?: number },
  ) {
    const query = input.query?.trim;
    if (!query) {
      throw new ApiException('validation_error', 'query is required', HttpStatus.BAD_REQUEST);
    }
    const take = Math.min(Math.max(input.limit ?? 20, 1), 100);
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date } }],
        content: { contains: query, mode: 'insensitive' },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(take * 3, 200),
    });

    let hits = rows.filter((r) => this.isKnowledgeLayer(r));
    if (input.scope) {
      const scope = this.assertScope(input.scope);
      hits = hits.filter((r) => this.metaOf(r).kmScope === scope);
    }
    if (input.documentId) {
      hits = hits.filter((r) => this.metaOf(r).documentId === input.documentId);
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_memory.searched',
      route: 'POST /v1/knowledge-memory/search',
      ip: input.ip,
      metadata: { hits: hits.length, queryLength: query.length },
    });

    return {
      query,
      hits: hits.slice(0, take).map((r) => this.present(r)),
      note: 'Text contains search over knowledge-layer memories. Vector NN deferred.',
      honesty: this.engine.honesty,
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        organizationId,
        workspaceId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date } }],
      },
      select: { metadata: true, version: true },
      take: 500,
    });
    const knowledge = rows.filter((r) => this.isKnowledgeLayer(r));
    const byScope = new Map<string, number>;
    let withDocument = 0;
    let evolved = 0;
    for (const r of knowledge) {
      const meta = this.metaOf(r);
      const scope = typeof meta.kmScope === 'string' ? meta.kmScope : 'unknown';
      byScope.set(scope, (byScope.get(scope) ?? 0) + 1);
      if (typeof meta.documentId === 'string') withDocument += 1;
      if (Array.isArray(meta.evolution) && meta.evolution.length > 0) evolved += 1;
    }
    return {
      workspace: { organizationId, workspaceId },
      active: knowledge.length,
      withDocument,
      evolved,
      byScope: [...byScope.entries].map(([scope, count]) => ({ scope, count })),
      note: 'Workspace-scoped Knowledge Memory analytics.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const engine = this.engine;
    const analytics = await this.analytics(organizationId, workspaceId);
    return {
      ...analytics,
      honesty: engine.honesty,
      deferred: engine.capabilities
        .filter((c) => c.status === 'deferred')
        .map((c) => c.id),
      links: engine.links,
    };
  }
}

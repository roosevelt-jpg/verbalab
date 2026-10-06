import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { KG_DOMAINS, knowledgeGraphCatalog } from './knowledge-graph.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable
export class KnowledgeGraphService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine {
    return knowledgeGraphCatalog;
  }

  domains {
    return {
      domains: KG_DOMAINS,
      note: 'Vertical domain packs deferred except general workspace graph.',
    };
  }

  private serializeEntity(row: {
    id: string;
    organizationId: string;
    workspaceId: string;
    type: string;
    name: string;
    description: string;
    documentId: string | null;
    domain: string;
    aliases: string[];
    metadata: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      workspaceId: row.workspaceId,
      type: row.type,
      name: row.name,
      description: row.description,
      documentId: row.documentId,
      domain: row.domain,
      aliases: row.aliases,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString,
      updatedAt: row.updatedAt.toISOString,
    };
  }

  private serializeRel(row: {
    id: string;
    organizationId: string;
    workspaceId: string;
    fromEntityId: string;
    toEntityId: string;
    type: string;
    label: string;
    weight: number;
    metadata: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      workspaceId: row.workspaceId,
      fromEntityId: row.fromEntityId,
      toEntityId: row.toEntityId,
      type: row.type,
      label: row.label,
      weight: row.weight,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString,
      updatedAt: row.updatedAt.toISOString,
    };
  }

  private assertDomain(domain: string) {
    const known = KG_DOMAINS.find((d) => d.id === domain);
    if (!known) {
      throw new ApiException(
        'validation_error',
        `domain must be one of: ${KG_DOMAINS.map((d) => d.id).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (known.status === 'deferred') {
      throw new ApiException(
        'validation_error',
        `domain "${domain}" pack is deferred — use domain=general`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return domain;
  }

  private async assertEntity(organizationId: string, workspaceId: string, id: string) {
    const row = await this.prisma.kgEntity.findFirst({
      where: { id, organizationId, workspaceId },
    });
    if (!row) {
      throw new ApiException('not_found', 'entity not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  async createEntity(
    input: AuthCtx & {
      name: string;
      type?: string;
      description?: string;
      documentId?: string;
      domain?: string;
      aliases?: string[];
      metadata?: Record<string, unknown>;
    },
  ) {
    const name = input.name?.trim;
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const domain = this.assertDomain(input.domain ?? 'general');

    if (input.documentId) {
      const doc = await this.prisma.knowledgeDocument.findFirst({
        where: {
          id: input.documentId,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      });
      if (!doc) {
        throw new ApiException('not_found', 'knowledge document not found', HttpStatus.NOT_FOUND);
      }
    }

    const row = await this.prisma.kgEntity.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        name,
        type: (input.type?.trim || 'concept').slice(0, 64),
        description: input.description?.trim ?? '',
        documentId: input.documentId ?? null,
        domain,
        aliases: (input.aliases ?? []).map((a) => a.trim).filter(Boolean).slice(0, 20),
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_graph.entity_created',
      route: 'POST /v1/knowledge-graph/entities',
      ip: input.ip,
      metadata: { id: row.id, type: row.type, domain: row.domain },
    });

    return this.serializeEntity(row);
  }

  async listEntities(
    input: AuthCtx & { type?: string; domain?: string; q?: string; limit?: number },
  ) {
    const take = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const rows = await this.prisma.kgEntity.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.type ? { type: input.type } : {}),
        ...(input.domain ? { domain: input.domain } : {}),
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q, mode: 'insensitive' } },
                { description: { contains: input.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });
    return { data: rows.map((r) => this.serializeEntity(r)) };
  }

  async getEntity(input: AuthCtx & { id: string }) {
    const row = await this.assertEntity(input.organizationId, input.workspaceId, input.id);
    return this.serializeEntity(row);
  }

  async deleteEntity(input: AuthCtx & { id: string }) {
    await this.assertEntity(input.organizationId, input.workspaceId, input.id);
    await this.prisma.kgEntity.delete({ where: { id: input.id } });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_graph.entity_deleted',
      route: 'DELETE /v1/knowledge-graph/entities/:id',
      ip: input.ip,
      metadata: { id: input.id },
    });
    return { deleted: true, id: input.id };
  }

  async createRelationship(
    input: AuthCtx & {
      fromEntityId: string;
      toEntityId: string;
      type?: string;
      label?: string;
      weight?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (!input.fromEntityId || !input.toEntityId) {
      throw new ApiException(
        'validation_error',
        'fromEntityId and toEntityId are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.fromEntityId === input.toEntityId) {
      throw new ApiException(
        'validation_error',
        'fromEntityId and toEntityId must differ',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.assertEntity(input.organizationId, input.workspaceId, input.fromEntityId);
    await this.assertEntity(input.organizationId, input.workspaceId, input.toEntityId);

    const row = await this.prisma.kgRelationship.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        fromEntityId: input.fromEntityId,
        toEntityId: input.toEntityId,
        type: (input.type?.trim || 'related_to').slice(0, 64),
        label: input.label?.trim ?? '',
        weight:
          typeof input.weight === 'number' && Number.isFinite(input.weight) ? input.weight : 1,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_graph.relationship_created',
      route: 'POST /v1/knowledge-graph/relationships',
      ip: input.ip,
      metadata: { id: row.id, type: row.type },
    });

    return this.serializeRel(row);
  }

  async listRelationships(input: AuthCtx & { entityId?: string; type?: string; limit?: number }) {
    const take = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const rows = await this.prisma.kgRelationship.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.type ? { type: input.type } : {}),
        ...(input.entityId
          ? {
              OR: [{ fromEntityId: input.entityId }, { toEntityId: input.entityId }],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { data: rows.map((r) => this.serializeRel(r)) };
  }

  async neighborhood(input: AuthCtx & { entityId: string }) {
    const entity = await this.assertEntity(
      input.organizationId,
      input.workspaceId,
      input.entityId,
    );
    const edges = await this.prisma.kgRelationship.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        OR: [{ fromEntityId: entity.id }, { toEntityId: entity.id }],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    const neighborIds = [
      ...new Set(
        edges.flatMap((e) =>
          e.fromEntityId === entity.id ? [e.toEntityId] : [e.fromEntityId],
        ),
      ),
    ];
    const neighbors = neighborIds.length
      ? await this.prisma.kgEntity.findMany({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            id: { in: neighborIds },
          },
        })
      : [];

    return {
      entity: this.serializeEntity(entity),
      relationships: edges.map((e) => this.serializeRel(e)),
      neighbors: neighbors.map((n) => this.serializeEntity(n)),
      note: '1-hop neighborhood. Multi-hop / Cypher deferred.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date;
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const [entities, relationships, entityWrites, relWrites] = await Promise.all([
      this.prisma.kgEntity.count({ where: { organizationId, workspaceId } }),
      this.prisma.kgRelationship.count({ where: { organizationId, workspaceId } }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'knowledge_graph.entity_created',
          createdAt: { gte: start },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'knowledge_graph.relationship_created',
          createdAt: { gte: start },
        },
      }),
    ]);

    return {
      periodStart: start.toISOString,
      entities,
      relationships,
      entityWrites,
      relationshipWrites: relWrites,
      note: 'Knowledge Graph analytics. Prefer RAG for retrieval quality.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const [analytics, engine] = await Promise.all([
      this.analytics(organizationId, workspaceId),
      Promise.resolve(this.engine),
    ]);
    return {
      generatedAt: new Date.toISOString,
      periodStart: analytics.periodStart,
      entities: analytics.entities,
      relationships: analytics.relationships,
      neo4jParity: engine.honesty.neo4jParity,
      ontologyPlatform: engine.honesty.ontologyPlatform,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Knowledge Graph monitoring snapshot.',
    };
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  ONTOLOGY_DOMAINS,
  ONTOLOGY_REL_TYPES,
  ontologyPlatformCatalog,
} from './ontology-platform.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class OntologyPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return ontologyPlatformCatalog();
  }

  domains() {
    return {
      domains: ONTOLOGY_DOMAINS.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        notes:
          d.status === 'deferred'
            ? 'Domain tag allowed on concepts; certified vertical ontology pack deferred.'
            : 'Default workspace ontology domain.',
      })),
      note: 'Vertical packs are tags, not OWL/SNOMED/FIBO OS (VL-196).',
    };
  }

  private assertDomain(domain: string): string {
    const id = domain.trim() || 'general';
    if (!ONTOLOGY_DOMAINS.some((d) => d.id === id)) {
      throw new ApiException(
        'validation_error',
        `domain must be one of: ${ONTOLOGY_DOMAINS.map((d) => d.id).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return id;
  }

  async createConcept(
    input: AuthCtx & {
      name?: string;
      description?: string;
      domain?: string;
      type?: string;
      aliases?: string[];
      labels?: Record<string, string>;
      documentId?: string;
    },
  ) {
    const labels = this.normalizeLabels(input.labels);
    const concept = await this.knowledgeGraph.createEntity({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      name: input.name ?? '',
      description: input.description,
      domain: this.assertDomain(input.domain ?? 'general'),
      type: input.type === 'category' ? 'category' : 'concept',
      aliases: input.aliases,
      documentId: input.documentId,
      metadata: labels ? { labels } : {},
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ontology.concept_created',
      route: 'POST /v1/ontology/concepts',
      ip: input.ip,
      metadata: { id: concept.id, domain: concept.domain },
    });

    return concept;
  }

  listConcepts(
    input: AuthCtx & { domain?: string; type?: string; q?: string; limit?: number },
  ) {
    return this.knowledgeGraph.listEntities({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      domain: input.domain,
      type: input.type ?? undefined,
      q: input.q,
      limit: input.limit,
    });
  }

  getConcept(input: AuthCtx & { id: string }) {
    return this.knowledgeGraph.getEntity(input);
  }

  async deleteConcept(input: AuthCtx & { id: string }) {
    const result = await this.knowledgeGraph.deleteEntity(input);
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ontology.concept_deleted',
      route: 'DELETE /v1/ontology/concepts/:id',
      ip: input.ip,
      metadata: { id: input.id },
    });
    return result;
  }

  async setLabels(
    input: AuthCtx & { id: string; labels?: Record<string, string> },
  ) {
    const row = await this.prisma.kgEntity.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Concept not found', HttpStatus.NOT_FOUND);
    }
    const labels = this.normalizeLabels(input.labels);
    if (!labels || Object.keys(labels).length === 0) {
      throw new ApiException(
        'validation_error',
        'labels object with at least one lang key is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const prev =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
    const updated = await this.prisma.kgEntity.update({
      where: { id: row.id },
      data: {
        metadata: {
          ...prev,
          labels: { ...((prev.labels as Record<string, string>) ?? {}), ...labels },
        } as Prisma.InputJsonValue,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ontology.labels_updated',
      route: 'POST /v1/ontology/concepts/:id/labels',
      ip: input.ip,
      metadata: { id: updated.id, langs: Object.keys(labels) },
    });
    return this.knowledgeGraph.getEntity({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      id: updated.id,
    });
  }

  async addHierarchy(
    input: AuthCtx & {
      parentId?: string;
      childId?: string;
      label?: string;
    },
  ) {
    if (!input.parentId || !input.childId) {
      throw new ApiException(
        'validation_error',
        'parentId and childId are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const rel = await this.knowledgeGraph.createRelationship({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      fromEntityId: input.childId,
      toEntityId: input.parentId,
      type: 'is_a',
      label: input.label?.trim() || 'is_a',
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ontology.hierarchy_created',
      route: 'POST /v1/ontology/hierarchies',
      ip: input.ip,
      metadata: { id: rel.id, parentId: input.parentId, childId: input.childId },
    });
    return {
      ...rel,
      note: 'is_a edge: child → parent. Transitive closure deferred.',
    };
  }

  async children(input: AuthCtx & { id: string; limit?: number }) {
    await this.knowledgeGraph.getEntity(input);
    const take = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const edges = await this.prisma.kgRelationship.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        type: 'is_a',
        toEntityId: input.id,
      },
      take,
      orderBy: { createdAt: 'asc' },
    });
    const childIds = edges.map((e) => e.fromEntityId);
    const concepts = childIds.length
      ? await this.prisma.kgEntity.findMany({
          where: {
            id: { in: childIds },
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
          },
        })
      : [];
    const byId = new Map(concepts.map((c) => [c.id, c]));
    return {
      parentId: input.id,
      children: edges
        .map((e) => {
          const c = byId.get(e.fromEntityId);
          return c
            ? {
                id: c.id,
                name: c.name,
                type: c.type,
                domain: c.domain,
                relationshipId: e.id,
              }
            : null;
        })
        .filter(Boolean),
      note: 'Direct is_a children only (1 level).',
    };
  }

  async addSynonym(
    input: AuthCtx & {
      conceptId?: string;
      synonym?: string;
      synonymConceptId?: string;
    },
  ) {
    if (!input.conceptId) {
      throw new ApiException('validation_error', 'conceptId is required', HttpStatus.BAD_REQUEST);
    }
    const concept = await this.prisma.kgEntity.findFirst({
      where: {
        id: input.conceptId,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!concept) {
      throw new ApiException('not_found', 'Concept not found', HttpStatus.NOT_FOUND);
    }

    let synonymEdge: unknown = null;
    if (input.synonymConceptId) {
      synonymEdge = await this.knowledgeGraph.createRelationship({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        ip: input.ip,
        fromEntityId: input.conceptId,
        toEntityId: input.synonymConceptId,
        type: 'synonym_of',
        label: 'synonym_of',
      });
    }

    const synonym = input.synonym?.trim();
    let updated = concept;
    if (synonym) {
      const aliases = [...new Set([...concept.aliases, synonym.toLowerCase()])].slice(0, 20);
      updated = await this.prisma.kgEntity.update({
        where: { id: concept.id },
        data: { aliases },
      });
    } else if (!input.synonymConceptId) {
      throw new ApiException(
        'validation_error',
        'synonym string or synonymConceptId is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ontology.synonym_added',
      route: 'POST /v1/ontology/synonyms',
      ip: input.ip,
      metadata: {
        conceptId: concept.id,
        synonym: synonym ?? null,
        synonymConceptId: input.synonymConceptId ?? null,
      },
    });

    return {
      concept: await this.knowledgeGraph.getEntity({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        id: updated.id,
      }),
      edge: synonymEdge,
      relationTypes: ONTOLOGY_REL_TYPES,
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const [concepts, categories, isA, synonyms] = await Promise.all([
      this.prisma.kgEntity.count({
        where: { organizationId, workspaceId, type: 'concept' },
      }),
      this.prisma.kgEntity.count({
        where: { organizationId, workspaceId, type: 'category' },
      }),
      this.prisma.kgRelationship.count({
        where: { organizationId, workspaceId, type: 'is_a' },
      }),
      this.prisma.kgRelationship.count({
        where: { organizationId, workspaceId, type: 'synonym_of' },
      }),
    ]);
    return {
      workspace: { organizationId, workspaceId },
      concepts,
      categories,
      hierarchyEdges: isA,
      synonymEdges: synonyms,
      note: 'Workspace-scoped Ontology analytics (VL-196).',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const engine = this.engine();
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

  private normalizeLabels(labels?: Record<string, string>): Record<string, string> | null {
    if (!labels || typeof labels !== 'object') return null;
    const out: Record<string, string> = {};
    for (const [lang, value] of Object.entries(labels)) {
      const l = lang.trim().toLowerCase().slice(0, 16);
      const v = String(value ?? '').trim().slice(0, 200);
      if (l && v) out[l] = v;
    }
    return Object.keys(out).length ? out : null;
  }
}

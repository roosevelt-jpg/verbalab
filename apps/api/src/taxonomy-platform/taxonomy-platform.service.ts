import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { KNOWLEDGE_CONTENT_KINDS } from '../knowledge-base/knowledge-base.catalog';
import {
  TAXONOMY_KINDS,
  TaxonomyKind,
  taxonomyPlatformCatalog,
} from './taxonomy-platform.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class TaxonomyPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return taxonomyPlatformCatalog();
  }

  contentTypes() {
    return {
      kinds: KNOWLEDGE_CONTENT_KINDS.map((id) => ({ id, source: 'knowledge-base' })),
      note: 'Shipped EKB content kinds. Taxonomy content_type terms may mirror these slugs.',
    };
  }

  private assertKind(kind: string): TaxonomyKind {
    if (!(TAXONOMY_KINDS as readonly string[]).includes(kind)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of: ${TAXONOMY_KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return kind as TaxonomyKind;
  }

  private slugify(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  private serialize(term: {
    id: string;
    organizationId: string;
    workspaceId: string;
    parentId: string | null;
    slug: string;
    name: string;
    kind: string;
    description: string;
    sortOrder: number;
    metadata: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: term.id,
      organizationId: term.organizationId,
      workspaceId: term.workspaceId,
      parentId: term.parentId,
      slug: term.slug,
      name: term.name,
      kind: term.kind,
      description: term.description,
      sortOrder: term.sortOrder,
      metadata: term.metadata,
      createdAt: term.createdAt.toISOString(),
      updatedAt: term.updatedAt.toISOString(),
    };
  }

  async createTerm(
    input: AuthCtx & {
      name?: string;
      slug?: string;
      kind?: string;
      parentId?: string | null;
      description?: string;
      sortOrder?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    const name = input.name?.trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const kind = this.assertKind(input.kind ?? 'category');
    const slug = (input.slug?.trim() || this.slugify(name)) || `term-${Date.now()}`;

    if (input.parentId) {
      const parent = await this.prisma.taxonomyTerm.findFirst({
        where: {
          id: input.parentId,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      });
      if (!parent) {
        throw new ApiException('not_found', 'Parent term not found', HttpStatus.NOT_FOUND);
      }
    }

    try {
      const row = await this.prisma.taxonomyTerm.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          parentId: input.parentId ?? null,
          slug,
          name,
          kind,
          description: input.description?.trim() ?? '',
          sortOrder:
            typeof input.sortOrder === 'number' && Number.isFinite(input.sortOrder)
              ? input.sortOrder
              : 0,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'taxonomy.term_created',
        route: 'POST /v1/taxonomy/terms',
        ip: input.ip,
        metadata: { id: row.id, kind: row.kind, slug: row.slug },
      });
      return this.serialize(row);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiException(
          'conflict',
          `slug already exists in workspace: ${slug}`,
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }
  }

  async listTerms(
    input: AuthCtx & { kind?: string; parentId?: string | null; q?: string; limit?: number },
  ) {
    const take = Math.min(Math.max(input.limit ?? 100, 1), 200);
    const rows = await this.prisma.taxonomyTerm.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.kind ? { kind: this.assertKind(input.kind) } : {}),
        ...(input.parentId === null
          ? { parentId: null }
          : input.parentId
            ? { parentId: input.parentId }
            : {}),
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q, mode: 'insensitive' } },
                { slug: { contains: input.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take,
    });
    return { data: rows.map((r) => this.serialize(r)) };
  }

  async getTerm(input: AuthCtx & { id: string }) {
    const row = await this.prisma.taxonomyTerm.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Taxonomy term not found', HttpStatus.NOT_FOUND);
    }
    return this.serialize(row);
  }

  async children(input: AuthCtx & { id: string }) {
    await this.getTerm(input);
    const rows = await this.prisma.taxonomyTerm.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        parentId: input.id,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 200,
    });
    return { parentId: input.id, children: rows.map((r) => this.serialize(r)) };
  }

  async trees(input: AuthCtx & { kind?: string }) {
    const roots = await this.prisma.taxonomyTerm.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        parentId: null,
        ...(input.kind ? { kind: this.assertKind(input.kind) } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 100,
    });
    const rootIds = roots.map((r) => r.id);
    const kids = rootIds.length
      ? await this.prisma.taxonomyTerm.findMany({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            parentId: { in: rootIds },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        })
      : [];
    const byParent = new Map<string, typeof kids>();
    for (const k of kids) {
      const list = byParent.get(k.parentId!) ?? [];
      list.push(k);
      byParent.set(k.parentId!, list);
    }
    return {
      trees: roots.map((r) => ({
        ...this.serialize(r),
        children: (byParent.get(r.id) ?? []).map((c) => this.serialize(c)),
      })),
      note: 'Roots + one child level. Deeper levels via GET /terms/:id/children.',
    };
  }

  async deleteTerm(input: AuthCtx & { id: string }) {
    await this.getTerm(input);
    await this.prisma.taxonomyTerm.delete({ where: { id: input.id } });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'taxonomy.term_deleted',
      route: 'DELETE /v1/taxonomy/terms/:id',
      ip: input.ip,
      metadata: { id: input.id },
    });
    return { deleted: true, id: input.id };
  }

  async assign(
    input: AuthCtx & { termId?: string; documentId?: string; syncDocument?: boolean },
  ) {
    if (!input.termId || !input.documentId) {
      throw new ApiException(
        'validation_error',
        'termId and documentId are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const term = await this.prisma.taxonomyTerm.findFirst({
      where: {
        id: input.termId,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!term) {
      throw new ApiException('not_found', 'Taxonomy term not found', HttpStatus.NOT_FOUND);
    }
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: input.documentId,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!doc) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }

    const assignment = await this.prisma.taxonomyAssignment.upsert({
      where: { termId_documentId: { termId: term.id, documentId: doc.id } },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        termId: term.id,
        documentId: doc.id,
        source: 'manual',
      },
      update: { source: 'manual' },
    });

    if (input.syncDocument !== false) {
      if (term.kind === 'category') {
        await this.prisma.knowledgeDocument.update({
          where: { id: doc.id },
          data: { collection: term.slug },
        });
      } else if (term.kind === 'tag') {
        const tags = [...new Set([...doc.tags, term.slug])].slice(0, 32);
        await this.prisma.knowledgeDocument.update({
          where: { id: doc.id },
          data: { tags },
        });
      } else if (term.kind === 'content_type') {
        await this.prisma.knowledgeDocument.update({
          where: { id: doc.id },
          data: { contentKind: term.slug },
        });
      }
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'taxonomy.assigned',
      route: 'POST /v1/taxonomy/assign',
      ip: input.ip,
      metadata: { termId: term.id, documentId: doc.id },
    });

    return {
      id: assignment.id,
      termId: term.id,
      documentId: doc.id,
      source: assignment.source,
      syncedDocument: input.syncDocument !== false,
    };
  }

  async classify(
    input: AuthCtx & { documentId?: string; apply?: boolean },
  ) {
    if (!input.documentId) {
      throw new ApiException('validation_error', 'documentId is required', HttpStatus.BAD_REQUEST);
    }
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: {
        id: input.documentId,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!doc) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }

    const terms = await this.prisma.taxonomyTerm.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      take: 200,
    });

    const hay = `${doc.filename} ${doc.collection} ${doc.contentKind} ${doc.tags.join(' ')}`.toLowerCase();
    const matches = terms.filter(
      (t) => hay.includes(t.slug.toLowerCase()) || hay.includes(t.name.toLowerCase()),
    );

    const applied: string[] = [];
    if (input.apply) {
      for (const term of matches) {
        await this.prisma.taxonomyAssignment.upsert({
          where: { termId_documentId: { termId: term.id, documentId: doc.id } },
          create: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            termId: term.id,
            documentId: doc.id,
            source: 'heuristic',
          },
          update: { source: 'heuristic' },
        });
        applied.push(term.id);
      }
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'taxonomy.classified',
      route: 'POST /v1/taxonomy/classify',
      ip: input.ip,
      metadata: {
        documentId: doc.id,
        matches: matches.length,
        applied: applied.length,
      },
    });

    return {
      documentId: doc.id,
      matches: matches.map((t) => this.serialize(t)),
      applied: input.apply === true,
      appliedTermIds: applied,
      note: 'Keyword/heuristic only — not an ML auto-classification OS.',
      honesty: { mlAutoClassification: false },
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const [terms, categories, tags, contentTypes, assignments] = await Promise.all([
      this.prisma.taxonomyTerm.count({ where: { organizationId, workspaceId } }),
      this.prisma.taxonomyTerm.count({
        where: { organizationId, workspaceId, kind: 'category' },
      }),
      this.prisma.taxonomyTerm.count({ where: { organizationId, workspaceId, kind: 'tag' } }),
      this.prisma.taxonomyTerm.count({
        where: { organizationId, workspaceId, kind: 'content_type' },
      }),
      this.prisma.taxonomyAssignment.count({ where: { organizationId, workspaceId } }),
    ]);
    return {
      workspace: { organizationId, workspaceId },
      terms,
      categories,
      tags,
      contentTypes,
      assignments,
      note: 'Workspace-scoped Taxonomy analytics (VL-197).',
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
}

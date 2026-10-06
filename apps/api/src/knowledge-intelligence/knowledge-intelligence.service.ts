import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { KNOWLEDGE_MEMORY_LAYER } from '../knowledge-memory/knowledge-memory.catalog';
import { knowledgeIntelligenceCatalog } from './knowledge-intelligence.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

@Injectable
export class KnowledgeIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine {
    return knowledgeIntelligenceCatalog;
  }

  private tokens(text: string): string[] {
    return [
      ...new Set(
        text
          .toLowerCase
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length >= 3),
      ),
    ];
  }

  private confidenceFor(doc: {
    status: string;
    chunkCount: number;
    tags: string[];
    collection: string;
    error: string | null;
  }): { score: number; band: string; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0.2;
    if (doc.status === 'ready') {
      score += 0.45;
      reasons.push('status_ready');
    } else if (doc.status === 'failed') {
      score -= 0.15;
      reasons.push('status_failed');
    } else {
      reasons.push(`status_${doc.status}`);
    }
    if (doc.chunkCount > 0) {
      score += Math.min(0.25, doc.chunkCount * 0.02);
      reasons.push('has_chunks');
    } else {
      reasons.push('no_chunks');
    }
    if (doc.tags.length > 0) {
      score += 0.05;
      reasons.push('tagged');
    }
    if (doc.collection && doc.collection !== 'default') {
      score += 0.05;
      reasons.push('collection_set');
    }
    if (doc.error) {
      score -= 0.1;
      reasons.push('has_error');
    }
    score = Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
    const band = score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low';
    return { score, band, reasons };
  }

  async insight(organizationId: string, workspaceId: string) {
    const [documents, ready, failed, chunks, terms, concepts, memories] = await Promise.all([
      this.prisma.knowledgeDocument.count({ where: { organizationId, workspaceId } }),
      this.prisma.knowledgeDocument.count({
        where: { organizationId, workspaceId, status: 'ready' },
      }),
      this.prisma.knowledgeDocument.count({
        where: { organizationId, workspaceId, status: 'failed' },
      }),
      this.prisma.knowledgeChunk.count({ where: { organizationId, workspaceId } }),
      this.prisma.taxonomyTerm.count({ where: { organizationId, workspaceId } }),
      this.prisma.kgEntity.count({ where: { organizationId, workspaceId } }),
      this.prisma.memoryRecord.count({
        where: {
          organizationId,
          workspaceId,
          deletedAt: null,
        },
      }),
    ]);

    // Count knowledge-layer memories among a bounded sample.
    const memSample = await this.prisma.memoryRecord.findMany({
      where: { organizationId, workspaceId, deletedAt: null },
      select: { metadata: true },
      take: 300,
    });
    const knowledgeMemories = memSample.filter(
      (m) =>
        m.metadata &&
        typeof m.metadata === 'object' &&
        !Array.isArray(m.metadata) &&
        (m.metadata as Record<string, unknown>).layer === KNOWLEDGE_MEMORY_LAYER,
    ).length;

    return {
      workspace: { organizationId, workspaceId },
      documents,
      ready,
      failed,
      chunks,
      taxonomyTerms: terms,
      ontologyConcepts: concepts,
      memoryRows: memories,
      knowledgeMemories,
      note: 'Knowledge Intelligence insight snapshot.',
      honesty: this.engine.honesty,
    };
  }

  async discover(
    input: AuthCtx & { query?: string; limit?: number },
  ) {
    const query = input.query?.trim;
    if (!query) {
      throw new ApiException('validation_error', 'query is required', HttpStatus.BAD_REQUEST);
    }
    const take = Math.min(Math.max(input.limit ?? 10, 1), 30);

    const [docs, terms, concepts] = await Promise.all([
      this.prisma.knowledgeDocument.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          OR: [
            { filename: { contains: query, mode: 'insensitive' } },
            { collection: { contains: query, mode: 'insensitive' } },
            { tags: { has: query.toLowerCase } },
            { contentKind: { contains: query, mode: 'insensitive' } },
          ],
        },
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.taxonomyTerm.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
          ],
        },
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.kgEntity.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take,
        orderBy: { name: 'asc' },
      }),
    ]);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_intelligence.discovered',
      route: 'POST /v1/knowledge-intelligence/discover',
      ip: input.ip,
      metadata: {
        docs: docs.length,
        terms: terms.length,
        concepts: concepts.length,
        queryLength: query.length,
      },
    });

    return {
      query,
      documents: docs.map((d) => ({
        id: d.id,
        filename: d.filename,
        status: d.status,
        collection: d.collection,
        tags: d.tags,
        contentKind: d.contentKind,
      })),
      taxonomyTerms: terms.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        kind: t.kind,
      })),
      ontologyConcepts: concepts.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        description: c.description.slice(0, 160),
      })),
      note: 'Heuristic discovery across docs/taxonomy/ontology — not a knowledge discovery OS.',
    };
  }

  async link(input: AuthCtx & { documentId?: string; limit?: number }) {
    if (!input.documentId) {
      throw new ApiException('validation_error', 'documentId is required', HttpStatus.BAD_REQUEST);
    }
    const take = Math.min(Math.max(input.limit ?? 8, 1), 20);
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

    const candidates = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        id: { not: doc.id },
      },
      take: 80,
      orderBy: { updatedAt: 'desc' },
    });

    const seedTokens = new Set([
      ...this.tokens(doc.filename),
      ...doc.tags,
      ...(doc.collection ? [doc.collection.toLowerCase] : []),
      ...(doc.contentKind ? [doc.contentKind.toLowerCase] : []),
    ]);

    const scored = candidates
      .map((c) => {
        const reasons: string[] = [];
        let score = 0;
        if (c.collection && c.collection === doc.collection) {
          score += 0.4;
          reasons.push('same_collection');
        }
        const sharedTags = c.tags.filter((t) => doc.tags.includes(t));
        if (sharedTags.length) {
          score += Math.min(0.35, sharedTags.length * 0.15);
          reasons.push(`shared_tags:${sharedTags.join(',')}`);
        }
        if (c.contentKind && c.contentKind === doc.contentKind) {
          score += 0.1;
          reasons.push('same_content_kind');
        }
        const overlap = this.tokens(c.filename).filter((t) => seedTokens.has(t));
        if (overlap.length) {
          score += Math.min(0.25, overlap.length * 0.08);
          reasons.push(`filename_tokens:${overlap.slice(0, 4).join(',')}`);
        }
        return {
          id: c.id,
          filename: c.filename,
          collection: c.collection,
          tags: c.tags,
          score: Math.round(score * 1000) / 1000,
          reasons,
        };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, take);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_intelligence.linked',
      route: 'POST /v1/knowledge-intelligence/link',
      ip: input.ip,
      metadata: { documentId: doc.id, links: scored.length },
    });

    return {
      documentId: doc.id,
      filename: doc.filename,
      links: scored,
      note: 'Heuristic related-doc links — not automated knowledge-graph linking OS.',
    };
  }

  async recommend(input: AuthCtx & { query?: string; limit?: number }) {
    const take = Math.min(Math.max(input.limit ?? 8, 1), 20);
    const q = input.query?.trim.toLowerCase ?? '';
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        status: 'ready',
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    const ranked = docs
      .map((d) => {
        let score = 0.2 + Math.min(0.3, d.chunkCount * 0.02);
        const reasons: string[] = ['ready'];
        if (q) {
          if (d.filename.toLowerCase.includes(q)) {
            score += 0.4;
            reasons.push('filename_match');
          }
          if (d.tags.some((t) => t.includes(q) || q.includes(t))) {
            score += 0.25;
            reasons.push('tag_match');
          }
          if (d.collection.toLowerCase.includes(q)) {
            score += 0.15;
            reasons.push('collection_match');
          }
        } else {
          score += Math.min(0.2, d.tags.length * 0.05);
          reasons.push('recency_ready');
        }
        return {
          id: d.id,
          filename: d.filename,
          collection: d.collection,
          tags: d.tags,
          chunkCount: d.chunkCount,
          score: Math.round(score * 1000) / 1000,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, take);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_intelligence.recommended',
      route: 'POST /v1/knowledge-intelligence/recommend',
      ip: input.ip,
      metadata: { hits: ranked.length, hasQuery: Boolean(q) },
    });

    return {
      query: input.query?.trim || null,
      recommendations: ranked,
      note: 'Light heuristic recommendations — not collaborative filtering OS.',
      honesty: { retailRecommenderOs: false },
    };
  }

  async validate(input: AuthCtx & { documentId?: string }) {
    const where: Prisma.KnowledgeDocumentWhereInput = {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      ...(input.documentId ? { id: input.documentId } : {}),
    };
    const docs = await this.prisma.knowledgeDocument.findMany({
      where,
      take: input.documentId ? 1 : 100,
      orderBy: { updatedAt: 'desc' },
    });
    if (input.documentId && docs.length === 0) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }

    const results = docs.map((d) => {
      const issues: string[] = [];
      if (d.status !== 'ready') issues.push(`status_${d.status}`);
      if (d.chunkCount <= 0) issues.push('no_chunks');
      if (d.error) issues.push('error_present');
      if (!d.tags.length) issues.push('untagged');
      if (!d.collection || d.collection === 'default') issues.push('default_collection');
      return {
        id: d.id,
        filename: d.filename,
        status: d.status,
        chunkCount: d.chunkCount,
        ok: issues.filter((i) => i.startsWith('status_') || i === 'no_chunks' || i === 'error_present')
          .length === 0,
        issues,
      };
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_intelligence.validated',
      route: 'POST /v1/knowledge-intelligence/validate',
      ip: input.ip,
      metadata: {
        checked: results.length,
        failing: results.filter((r) => !r.ok).length,
      },
    });

    return {
      checked: results.length,
      failing: results.filter((r) => !r.ok).length,
      results,
      note: 'Structural validation only — not semantic fact-checking OS.',
    };
  }

  async duplicates(input: AuthCtx & { limit?: number }) {
    const take = Math.min(Math.max(input.limit ?? 20, 1), 50);
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      take: 100,
      orderBy: { createdAt: 'asc' },
      include: {
        chunks: {
          take: 1,
          orderBy: { ordinal: 'asc' },
          select: { content: true },
        },
      },
    });

    const pairs: Array<{
      a: { id: string; filename: string };
      b: { id: string; filename: string };
      reason: string;
      score: number;
    }> = [];

    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const a = docs[i]!;
        const b = docs[j]!;
        if (a.filename.toLowerCase === b.filename.toLowerCase) {
          pairs.push({
            a: { id: a.id, filename: a.filename },
            b: { id: b.id, filename: b.filename },
            reason: 'same_filename',
            score: 0.95,
          });
          continue;
        }
        const ca = a.chunks[0]?.content.slice(0, 120).toLowerCase ?? '';
        const cb = b.chunks[0]?.content.slice(0, 120).toLowerCase ?? '';
        if (ca && cb && ca === cb) {
          pairs.push({
            a: { id: a.id, filename: a.filename },
            b: { id: b.id, filename: b.filename },
            reason: 'same_first_chunk_prefix',
            score: 0.85,
          });
        }
      }
    }

    pairs.sort((x, y) => y.score - x.score);
    const limited = pairs.slice(0, take);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_intelligence.duplicates',
      route: 'POST /v1/knowledge-intelligence/duplicates',
      ip: input.ip,
      metadata: { pairs: limited.length },
    });

    return {
      pairs: limited,
      note: 'Filename / first-chunk prefix duplicates — ML near-dupe deferred.',
      honesty: { mlNearDuplicate: false },
    };
  }

  async evolution(organizationId: string, workspaceId: string) {
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: { organizationId, workspaceId },
      select: { id: true, filename: true, version: true, updatedAt: true },
      orderBy: { version: 'desc' },
      take: 50,
    });
    const memories = await this.prisma.memoryRecord.findMany({
      where: { organizationId, workspaceId, deletedAt: null },
      select: { id: true, version: true, metadata: true, updatedAt: true, content: true },
      take: 200,
    });
    const evolvedMemories = memories
      .filter((m) => {
        const meta =
          m.metadata && typeof m.metadata === 'object' && !Array.isArray(m.metadata)
            ? (m.metadata as Record<string, unknown>)
            : {};
        return (
          meta.layer === KNOWLEDGE_MEMORY_LAYER &&
          Array.isArray(meta.evolution) &&
          meta.evolution.length > 0
        );
      })
      .map((m) => {
        const meta = m.metadata as Record<string, unknown>;
        return {
          id: m.id,
          version: m.version,
          evolutionCount: Array.isArray(meta.evolution) ? meta.evolution.length : 0,
          preview: m.content.slice(0, 120),
          updatedAt: m.updatedAt.toISOString,
        };
      });

    return {
      documentVersions: docs.map((d) => ({
        id: d.id,
        filename: d.filename,
        version: d.version,
        updatedAt: d.updatedAt.toISOString,
      })),
      evolvedMemories,
      note: 'Evolution snapshot from doc versions + Knowledge Memory trails — not a knowledge VCS OS.',
    };
  }

  async confidence(input: AuthCtx & { documentId?: string; limit?: number }) {
    const take = Math.min(Math.max(input.limit ?? 20, 1), 50);
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.documentId ? { id: input.documentId } : {}),
      },
      take: input.documentId ? 1 : take,
      orderBy: { updatedAt: 'desc' },
    });
    if (input.documentId && docs.length === 0) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }

    const scores = docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      ...this.confidenceFor(d),
    }));

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge_intelligence.confidence',
      route: 'POST /v1/knowledge-intelligence/confidence',
      ip: input.ip,
      metadata: { scored: scores.length },
    });

    return {
      scores,
      note: 'Heuristic confidence — not a calibrated probabilistic model.',
      honesty: { calibratedConfidence: false },
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const insight = await this.insight(organizationId, workspaceId);
    const actions = [
      'knowledge_intelligence.discovered',
      'knowledge_intelligence.linked',
      'knowledge_intelligence.recommended',
      'knowledge_intelligence.validated',
      'knowledge_intelligence.duplicates',
      'knowledge_intelligence.confidence',
    ];
    const counts = await Promise.all(
      actions.map((action) =>
        this.prisma.auditEvent.count({
          where: { organizationId, action, createdAt: { gte: since } },
        }),
      ),
    );
    return {
      ...insight,
      auditsLast30d: Object.fromEntries(actions.map((a, i) => [a.split('.').pop!, counts[i]])),
      note: 'Knowledge Intelligence analytics. ≠ Knowledge Analytics pack.',
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

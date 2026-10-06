import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import {
  KNOWLEDGE_AUDIT_PREFIXES,
  KNOWLEDGE_SURFACE_ACTIONS,
  knowledgeAnalyticsCatalog,
} from './knowledge-analytics.catalog';

type PeriodInput = {
  organizationId: string;
  workspaceId: string;
  from?: string;
  to?: string;
};

@Injectable()
export class KnowledgeAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  engine() {
    return knowledgeAnalyticsCatalog();
  }

  async overview(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [growth, usage, quality, search, gaps, confidence, relationships] =
      await Promise.all([
        this.growth(input),
        this.usage(input),
        this.quality(input),
        this.search(input),
        this.gaps(input),
        this.confidence(input),
        this.relationships(input),
      ]);
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      growth: {
        documents: growth.documents,
        chunks: growth.chunks,
        documentsCreatedInPeriod: growth.documentsCreatedInPeriod,
      },
      usage: {
        totalEvents: usage.totalEvents,
        bySurface: usage.bySurface.slice(0, 12),
      },
      quality: {
        readyRate: quality.readyRate,
        avgChunksPerDoc: quality.avgChunksPerDoc,
        failed: quality.failed,
      },
      search: {
        searches: search.searches,
        zeroHitRate: search.zeroHitRate,
        avgHits: search.avgHits,
      },
      gaps: {
        unchunkedReady: gaps.unchunkedReady,
        failedDocs: gaps.failedDocs,
        zeroHitSearches: gaps.zeroHitSearches,
        unassignedDocs: gaps.unassignedDocs,
      },
      confidence: {
        avgScore: confidence.avgScore,
        samples: confidence.samples,
      },
      relationships: {
        kgEntities: relationships.kgEntities,
        kgRelationships: relationships.kgRelationships,
        taxonomyAssignments: relationships.taxonomyAssignments,
      },
      note: 'Knowledge Analytics overview (VL-202) — not Language/Speech/Voice/Intelligence analytics.',
    };
  }

  async growth(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [documents, chunks, createdInPeriod, ready, failed] = await Promise.all([
      this.prisma.knowledgeDocument.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.knowledgeChunk.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.knowledgeDocument.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.knowledgeDocument.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'ready',
        },
      }),
      this.prisma.knowledgeDocument.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'failed',
        },
      }),
    ]);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      workspace: { organizationId: input.organizationId, workspaceId: input.workspaceId },
      documents,
      chunks,
      ready,
      failed,
      documentsCreatedInPeriod: createdInPeriod,
      note: 'Knowledge growth from knowledge_documents/chunks (VL-202).',
    };
  }

  async usage(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const allActions = Object.values(KNOWLEDGE_SURFACE_ACTIONS).flat();
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: { in: allActions },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { action: true },
      take: 10_000,
    });

    const byAction: Record<string, number> = {};
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    }

    const bySurface = Object.entries(KNOWLEDGE_SURFACE_ACTIONS)
      .map(([surface, actions]) => {
        const count = actions.reduce((sum, a) => sum + (byAction[a] ?? 0), 0);
        return { surface, count };
      })
      .sort((a, b) => b.count - a.count);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalEvents: events.length,
      bySurface,
      byAction: Object.entries(byAction)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 40),
      note: 'Knowledge Cloud surface audit aggregates (VL-202).',
    };
  }

  async quality(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      select: { status: true, chunkCount: true, tags: true },
    });

    const total = docs.length;
    const ready = docs.filter((d) => d.status === 'ready').length;
    const failed = docs.filter((d) => d.status === 'failed').length;
    const processing = docs.filter((d) => d.status === 'processing').length;
    const withChunks = docs.filter((d) => d.chunkCount > 0).length;
    const tagged = docs.filter((d) => d.tags.length > 0).length;
    const chunkSum = docs.reduce((s, d) => s + d.chunkCount, 0);

    const validates = await this.prisma.auditEvent.count({
      where: {
        organizationId: input.organizationId,
        action: 'knowledge_intelligence.validated',
        createdAt: { gte: periodStart, lt: periodEnd },
      },
    });

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      documents: total,
      ready,
      failed,
      processing,
      withChunks,
      tagged,
      readyRate: total ? Number((ready / total).toFixed(3)) : null,
      chunkCoverage: total ? Number((withChunks / total).toFixed(3)) : null,
      avgChunksPerDoc: total ? Number((chunkSum / total).toFixed(2)) : null,
      validationsInPeriod: validates,
      note: 'Heuristic quality proxies — not a human knowledge eval lab (VL-202).',
    };
  }

  async search(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId: input.organizationId,
        action: 'enterprise_search.searched',
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      select: { metadata: true },
      take: 5000,
    });

    let zeroHits = 0;
    let hitSum = 0;
    const byMode: Record<string, number> = {};
    for (const e of events) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const hits = typeof meta.hits === 'number' ? meta.hits : 0;
      hitSum += hits;
      if (hits === 0) zeroHits += 1;
      const mode = typeof meta.mode === 'string' ? meta.mode : 'unknown';
      byMode[mode] = (byMode[mode] ?? 0) + 1;
    }

    const searches = events.length;
    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      searches,
      zeroHitSearches: zeroHits,
      zeroHitRate: searches ? Number((zeroHits / searches).toFixed(3)) : null,
      avgHits: searches ? Number((hitSum / searches).toFixed(2)) : null,
      byMode: Object.entries(byMode)
        .map(([mode, count]) => ({ mode, count }))
        .sort((a, b) => b.count - a.count),
      note: 'Search success from enterprise_search.searched audit metadata (VL-202).',
    };
  }

  async gaps(input: PeriodInput) {
    const { periodStart, periodEnd } = this.parsePeriod(input.from, input.to);
    const [unchunkedReady, failedDocs, assignedDocIds, totalDocs, zeroHit] =
      await Promise.all([
        this.prisma.knowledgeDocument.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            status: 'ready',
            chunkCount: 0,
          },
        }),
        this.prisma.knowledgeDocument.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            status: 'failed',
          },
        }),
        this.prisma.taxonomyAssignment.findMany({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
          },
          select: { documentId: true },
          distinct: ['documentId'],
        }),
        this.prisma.knowledgeDocument.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
          },
        }),
        this.prisma.auditEvent.findMany({
          where: {
            organizationId: input.organizationId,
            action: 'enterprise_search.searched',
            createdAt: { gte: periodStart, lt: periodEnd },
          },
          select: { metadata: true },
          take: 5000,
        }),
      ]);

    const zeroHitSearches = zeroHit.filter((e) => {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      return typeof meta.hits === 'number' ? meta.hits === 0 : true;
    }).length;

    const assigned = assignedDocIds.length;
    const unassignedDocs = Math.max(0, totalDocs - assigned);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      unchunkedReady,
      failedDocs,
      zeroHitSearches,
      unassignedDocs,
      assignedDocs: assigned,
      totalDocs,
      note: 'Gap heuristics — not a knowledge coverage OS (VL-202).',
    };
  }

  async confidence(input: PeriodInput) {
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      select: {
        status: true,
        chunkCount: true,
        tags: true,
        collection: true,
        error: true,
      },
      take: 500,
    });

    const scores = docs.map((d) => this.docConfidence(d).score);
    const avg =
      scores.length > 0
        ? Number((scores.reduce((s, n) => s + n, 0) / scores.length).toFixed(3))
        : null;
    const bands = { high: 0, medium: 0, low: 0 };
    for (const d of docs) {
      bands[this.docConfidence(d).band as 'high' | 'medium' | 'low'] += 1;
    }

    return {
      workspace: { organizationId: input.organizationId, workspaceId: input.workspaceId },
      samples: scores.length,
      avgScore: avg,
      bands,
      note: 'Heuristic confidence — not a calibrated probabilistic model (VL-202).',
      honesty: { calibratedConfidence: false },
    };
  }

  async relationships(input: PeriodInput) {
    const [kgEntities, kgRelationships, taxonomyTerms, taxonomyAssignments, ontologyConcepts] =
      await Promise.all([
        this.prisma.kgEntity.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
          },
        }),
        this.prisma.kgRelationship.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
          },
        }),
        this.prisma.taxonomyTerm.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
          },
        }),
        this.prisma.taxonomyAssignment.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
          },
        }),
        this.prisma.kgEntity.count({
          where: {
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            type: { in: ['concept', 'category'] },
          },
        }),
      ]);

    return {
      workspace: { organizationId: input.organizationId, workspaceId: input.workspaceId },
      kgEntities,
      kgRelationships,
      taxonomyTerms,
      taxonomyAssignments,
      ontologyConcepts,
      note: 'Relationship counts from KG/taxonomy tables; ontologyConcepts = concept|category entities (VL-202).',
    };
  }

  async report(input: PeriodInput) {
    const [overview, growth, usage, quality, search, gaps, confidence, relationships] =
      await Promise.all([
        this.overview(input),
        this.growth(input),
        this.usage(input),
        this.quality(input),
        this.search(input),
        this.gaps(input),
        this.confidence(input),
        this.relationships(input),
      ]);
    return {
      generatedAt: new Date().toISOString(),
      overview,
      growth,
      usage,
      quality,
      search,
      gaps,
      confidence,
      relationships,
      honesty: knowledgeAnalyticsCatalog().honesty,
      note: 'Bundled Knowledge Analytics report (VL-202).',
    };
  }

  async monitoring(input: PeriodInput) {
    const [overview, engine] = await Promise.all([
      this.overview(input),
      Promise.resolve(this.engine()),
    ]);
    const recent = await this.prisma.auditEvent.count({
      where: {
        organizationId: input.organizationId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        OR: KNOWLEDGE_AUDIT_PREFIXES.map((p) => ({ action: { startsWith: p } })),
      },
    });
    return {
      generatedAt: new Date().toISOString(),
      periodStart: overview.periodStart,
      periodEnd: overview.periodEnd,
      documents: overview.growth.documents,
      chunks: overview.growth.chunks,
      eventsLast24h: recent,
      regeneratesIntelligenceAnalytics: engine.honesty.regeneratesIntelligenceAnalytics,
      biDashboardOs: engine.honesty.biDashboardOs,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Knowledge Analytics monitoring snapshot (VL-202).',
    };
  }

  private docConfidence(doc: {
    status: string;
    chunkCount: number;
    tags: string[];
    collection: string;
    error: string | null;
  }): { score: number; band: string } {
    let score = 0.2;
    if (doc.status === 'ready') score += 0.45;
    else if (doc.status === 'failed') score -= 0.15;
    if (doc.chunkCount > 0) score += Math.min(0.25, doc.chunkCount * 0.02);
    if (doc.tags.length > 0) score += 0.05;
    if (doc.collection && doc.collection !== 'default') score += 0.05;
    if (doc.error) score -= 0.1;
    score = Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
    const band = score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low';
    return { score, band };
  }

  private parsePeriod(fromRaw?: string, toRaw?: string): {
    periodStart: Date;
    periodEnd: Date;
  } {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (fromRaw) {
      periodStart = new Date(fromRaw);
      if (Number.isNaN(periodStart.getTime())) {
        throw new ApiException('validation_error', 'from must be an ISO date', HttpStatus.BAD_REQUEST);
      }
    } else {
      periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }

    if (toRaw) {
      periodEnd = new Date(toRaw);
      if (Number.isNaN(periodEnd.getTime())) {
        throw new ApiException('validation_error', 'to must be an ISO date', HttpStatus.BAD_REQUEST);
      }
    } else {
      periodEnd = new Date(now.getTime() + 1);
    }

    if (periodEnd <= periodStart) {
      throw new ApiException(
        'validation_error',
        'to must be after from',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { periodStart, periodEnd };
  }
}

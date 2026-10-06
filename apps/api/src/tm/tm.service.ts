import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { GatewayService } from '../gateway/gateway.service';
import { embeddingToSql } from '../knowledge/knowledge.util';
import { hashTmSegment, normalizeTmSegment } from './tm-hash';
import { tmIntelligenceCatalog } from './tm-intelligence.catalog';
import { isTmScope, lexicalSimilarity, TmScope } from './tm-similarity';

const SEARCH_CANDIDATE_LIMIT = 400;

@Injectable
export class TmService {
  private readonly logger = new Logger(TmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly gateway: GatewayService,
  ) {}

  intelligence {
    return tmIntelligenceCatalog;
  }

  list(
    organizationId: string,
    workspaceId: string,
    pair?: { source?: string; target?: string; scope?: string; projectKey?: string },
  ) {
    return this.prisma.translationMemoryEntry.findMany({
      where: {
        organizationId,
        ...(pair?.scope === 'enterprise' || pair?.scope === 'shared'
          ? { scope: pair.scope }
          : pair?.scope === 'project'
            ? { scope: 'project', projectKey: pair.projectKey?.trim || undefined }
            : { workspaceId, ...(pair?.scope ? { scope: pair.scope } : {}) }),
        ...(pair?.source ? { sourceLang: pair.source } : {}),
        ...(pair?.target ? { targetLang: pair.target } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        organizationId: true,
        workspaceId: true,
        scope: true,
        projectKey: true,
        sourceLang: true,
        targetLang: true,
        sourceText: true,
        targetText: true,
        sourceHash: true,
        approved: true,
        hitCount: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const [entries, versions, upserts, searches, glossaryTerms] = await Promise.all([
      this.prisma.translationMemoryEntry.count({ where: { organizationId } }),
      this.prisma.translationMemoryVersion.count({
        where: { entry: { organizationId } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'tm.entry_upserted', createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'tm.search', createdAt: { gte: since } },
      }),
      this.prisma.glossaryTerm.count({ where: { organizationId } }),
    ]);

    const byScope = await this.prisma.translationMemoryEntry.groupBy({
      by: ['scope'],
      where: { organizationId },
      _count: { _all: true },
    });

    return {
      windowDays: 30,
      entries,
      versions,
      upserts,
      searches,
      glossaryTerms,
      byScope: Object.fromEntries(byScope.map((r) => [r.scope, r._count._all])),
      note: 'Org TM usage — not a CAT-tool productivity scoreboard.',
    };
  }

  async terminology(organizationId: string, workspaceId: string) {
    const terms = await this.prisma.glossaryTerm.findMany({
      where: { organizationId, workspaceId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return {
      data: terms,
      count: terms.length,
      note: 'Terminology is the workspace glossary façade — not a separate termbase product.',
      api: '/v1/glossary/terms',
    };
  }

  async history(organizationId: string, workspaceId: string, opts?: { entryId?: string; limit?: number }) {
    const take = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
    const versions = await this.prisma.translationMemoryVersion.findMany({
      where: {
        entry: {
          organizationId,
          ...(opts?.entryId ? { id: opts.entryId } : { workspaceId }),
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        entry: {
          select: {
            id: true,
            sourceLang: true,
            targetLang: true,
            scope: true,
            projectKey: true,
            version: true,
          },
        },
      },
    });

    const audits = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { in: ['tm.entry_upserted', 'tm.entry_deleted', 'tm.search'] },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 30),
      select: { id: true, action: true, route: true, metadata: true, createdAt: true },
    });

    return {
      versions,
      audits,
      note: 'TM version snapshots + recent TM audit events.',
    };
  }

  async versions(organizationId: string, entryId: string) {
    const entry = await this.prisma.translationMemoryEntry.findFirst({
      where: { id: entryId, organizationId },
      select: { id: true, version: true, sourceText: true, targetText: true, scope: true },
    });
    if (!entry) {
      throw new ApiException('not_found', 'TM entry not found', HttpStatus.NOT_FOUND);
    }
    const rows = await this.prisma.translationMemoryVersion.findMany({
      where: { entryId },
      orderBy: { version: 'desc' },
    });
    return { entry, versions: rows };
  }

  async upsertApproved(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    sourceLang: string;
    targetLang: string;
    sourceText: string;
    targetText: string;
    scope?: string;
    projectKey?: string;
    ip?: string;
  }) {
    const org = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { persistSourceText: true },
    });
    if (org?.persistSourceText === false) {
      throw new ApiException(
        'persist_disabled',
        'Organization policy does not allow persisting source text (TM disabled)',
        HttpStatus.FORBIDDEN,
      );
    }

    const sourceText = normalizeTmSegment(input.sourceText);
    const targetText = input.targetText.trim;
    if (!sourceText || !targetText) {
      throw new ApiException(
        'validation_error',
        'sourceText and targetText are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!input.sourceLang || !input.targetLang) {
      throw new ApiException(
        'validation_error',
        'sourceLang and targetLang are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const scopeRaw = (input.scope ?? 'workspace').trim.toLowerCase;
    if (!isTmScope(scopeRaw)) {
      throw new ApiException(
        'validation_error',
        'scope must be workspace, enterprise, shared, or project',
        HttpStatus.BAD_REQUEST,
      );
    }
    const scope: TmScope = scopeRaw;
    const projectKey = scope === 'project' ? (input.projectKey?.trim || '') : '';
    if (scope === 'project' && !projectKey) {
      throw new ApiException(
        'validation_error',
        'projectKey is required when scope=project',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sourceHash = hashTmSegment(sourceText);
    const existing = await this.prisma.translationMemoryEntry.findUnique({
      where: {
        workspaceId_sourceLang_targetLang_sourceHash: {
          workspaceId: input.workspaceId,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          sourceHash,
        },
      },
    });

    let entry;
    if (existing) {
      const textChanged = existing.targetText !== targetText || existing.sourceText !== sourceText;
      if (textChanged) {
        await this.prisma.translationMemoryVersion.create({
          data: {
            entryId: existing.id,
            version: existing.version,
            sourceText: existing.sourceText,
            targetText: existing.targetText,
            scope: existing.scope,
            projectKey: existing.projectKey,
            createdById: input.userId,
          },
        });
      }
      entry = await this.prisma.translationMemoryEntry.update({
        where: { id: existing.id },
        data: {
          sourceText,
          targetText,
          approved: true,
          scope,
          projectKey,
          version: textChanged ? existing.version + 1 : existing.version,
        },
      });
    } else {
      entry = await this.prisma.translationMemoryEntry.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          scope,
          projectKey,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          sourceText,
          targetText,
          sourceHash,
          approved: true,
          version: 1,
        },
      });
    }

    await this.maybeStoreEmbedding(entry.id, sourceText);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'tm.entry_upserted',
      route: 'POST /v1/tm/entries',
      ip: input.ip,
      metadata: {
        entryId: entry.id,
        sourceLang: entry.sourceLang,
        targetLang: entry.targetLang,
        scope: entry.scope,
        projectKey: entry.projectKey,
        version: entry.version,
      },
    });

    return entry;
  }

  async remove(organizationId: string, entryId: string, meta?: { userId?: string; ip?: string }) {
    const existing = await this.prisma.translationMemoryEntry.findFirst({
      where: { id: entryId, organizationId },
    });
    if (!existing) {
      throw new ApiException('not_found', 'TM entry not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.translationMemoryEntry.delete({ where: { id: entryId } });
    await this.audit.record({
      organizationId,
      userId: meta?.userId,
      action: 'tm.entry_deleted',
      route: 'DELETE /v1/tm/entries/:id',
      ip: meta?.ip,
      metadata: { entryId },
    });
    return { id: entryId, deleted: true };
  }

  /**
   * Exact approved match: workspace first, then org enterprise/shared, then project.
   * Increments hit count when found.
   */
  async lookupExact(input: {
    organizationId: string;
    workspaceId: string;
    sourceLang: string;
    targetLang: string;
    sourceText: string;
    projectKey?: string;
  }) {
    const sourceHash = hashTmSegment(input.sourceText);

    const workspaceHit = await this.prisma.translationMemoryEntry.findFirst({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        sourceHash,
        approved: true,
      },
    });
    if (workspaceHit) {
      await this.bumpHit(workspaceHit.id);
      return workspaceHit;
    }

    const orgHit = await this.prisma.translationMemoryEntry.findFirst({
      where: {
        organizationId: input.organizationId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        sourceHash,
        approved: true,
        OR: [
          { scope: { in: ['enterprise', 'shared'] } },
          ...(input.projectKey
            ? [{ scope: 'project', projectKey: input.projectKey }]
            : []),
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (orgHit) {
      await this.bumpHit(orgHit.id);
      return orgHit;
    }

    return null;
  }

  async search(input: {
    organizationId: string;
    workspaceId: string;
    sourceLang: string;
    targetLang: string;
    text: string;
    projectKey?: string;
    mode?: 'lexical' | 'vector' | 'auto';
    limit?: number;
    minScore?: number;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const text = normalizeTmSegment(input.text);
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 50);
    const minScore = input.minScore ?? 0.35;
    const mode = input.mode ?? 'auto';

    const candidates = await this.prisma.translationMemoryEntry.findMany({
      where: {
        organizationId: input.organizationId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        approved: true,
        OR: [
          { workspaceId: input.workspaceId },
          { scope: { in: ['enterprise', 'shared'] } },
          ...(input.projectKey
            ? [{ scope: 'project' as const, projectKey: input.projectKey }]
            : []),
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: SEARCH_CANDIDATE_LIMIT,
      select: {
        id: true,
        workspaceId: true,
        scope: true,
        projectKey: true,
        sourceLang: true,
        targetLang: true,
        sourceText: true,
        targetText: true,
        version: true,
        hitCount: true,
      },
    });

    let provider: 'lexical' | 'vector' | 'lexical+vector' = 'lexical';
    let scored = candidates.map((c) => ({
      ...c,
      score: lexicalSimilarity(text, c.sourceText),
      match: 'lexical' as const,
    }));

    const wantVector = mode === 'vector' || mode === 'auto';
    if (wantVector && process.env.OPENAI_API_KEY?.trim) {
      const vectorHits = await this.vectorSearch({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        text,
        projectKey: input.projectKey,
        limit: limit * 2,
      });
      if (vectorHits.length > 0) {
        provider = mode === 'vector' ? 'vector' : 'lexical+vector';
        const byId = new Map(scored.map((s) => [s.id, s]));
        for (const hit of vectorHits) {
          const prev = byId.get(hit.id);
          const blended = prev
            ? Math.max(prev.score, hit.score * 0.95 + prev.score * 0.05)
            : hit.score;
          byId.set(hit.id, {
            ...(prev ?? {
              id: hit.id,
              workspaceId: hit.workspaceId,
              scope: hit.scope,
              projectKey: hit.projectKey,
              sourceLang: hit.sourceLang,
              targetLang: hit.targetLang,
              sourceText: hit.sourceText,
              targetText: hit.targetText,
              version: hit.version,
              hitCount: hit.hitCount,
              match: 'vector' as const,
            }),
            score: blended,
            match: prev ? ('lexical' as const) : ('vector' as const),
          });
        }
        scored = [...byId.values];
      } else if (mode === 'vector') {
        provider = 'lexical';
      }
    }

    const results = scored
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({
        ...r,
        score: Number(r.score.toFixed(4)),
      }));

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'tm.search',
      route: 'POST /v1/tm/search',
      ip: input.ip,
      metadata: {
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        mode,
        provider,
        resultCount: results.length,
      },
    });

    return {
      query: text,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      provider,
      results,
      resultCount: results.length,
      note:
        provider === 'lexical'
          ? 'Lexical bigram similarity. Set OPENAI_API_KEY for optional vector re-rank.'
          : 'Similarity search with optional pgvector re-rank. Not a CAT fuzzy-match product.',
    };
  }

  private async bumpHit(id: string) {
    await this.prisma.translationMemoryEntry.update({
      where: { id },
      data: { hitCount: { increment: 1 } },
    });
  }

  private async maybeStoreEmbedding(entryId: string, sourceText: string) {
    if (!process.env.OPENAI_API_KEY?.trim) return;
    try {
      const embedded = await this.gateway.embed({ input: [sourceText] });
      const dims = embedded.data[0]?.embedding;
      if (!dims?.length) return;
      await this.prisma.$executeRaw`
        UPDATE translation_memory_entries
        SET embedding = ${embeddingToSql(dims)}::vector
        WHERE id = ${entryId}
      `;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'tm.embed_failed',
          reason: error instanceof Error ? error.message : 'embed failed',
        }),
      );
    }
  }

  private async vectorSearch(input: {
    organizationId: string;
    workspaceId: string;
    sourceLang: string;
    targetLang: string;
    text: string;
    projectKey?: string;
    limit: number;
  }) {
    try {
      const embedded = await this.gateway.embed({ input: [input.text] });
      const dims = embedded.data[0]?.embedding;
      if (!dims?.length) return [];
      const vectorSql = embeddingToSql(dims);

      type Row = {
        id: string;
        workspace_id: string;
        scope: string;
        project_key: string;
        source_lang: string;
        target_lang: string;
        source_text: string;
        target_text: string;
        version: number;
        hit_count: number;
        score: number;
      };

      const projectKey = input.projectKey ?? '';
      const rows = await this.prisma.$queryRaw<Row[]>`
        SELECT
          e.id,
          e.workspace_id,
          e.scope,
          e.project_key,
          e.source_lang,
          e.target_lang,
          e.source_text,
          e.target_text,
          e.version,
          e.hit_count,
          (1 - (e.embedding <=> ${vectorSql}::vector))::float8 AS score
        FROM translation_memory_entries e
        WHERE e.organization_id = ${input.organizationId}
          AND e.source_lang = ${input.sourceLang}
          AND e.target_lang = ${input.targetLang}
          AND e.approved = true
          AND e.embedding IS NOT NULL
          AND (
            e.workspace_id = ${input.workspaceId}
            OR e.scope IN ('enterprise', 'shared')
            OR (e.scope = 'project' AND e.project_key = ${projectKey} AND ${projectKey} <> '')
          )
        ORDER BY e.embedding <=> ${vectorSql}::vector
        LIMIT ${input.limit}
      `;

      return rows.map((r) => ({
        id: r.id,
        workspaceId: r.workspace_id,
        scope: r.scope,
        projectKey: r.project_key,
        sourceLang: r.source_lang,
        targetLang: r.target_lang,
        sourceText: r.source_text,
        targetText: r.target_text,
        version: r.version,
        hitCount: r.hit_count,
        score: r.score,
      }));
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'tm.vector_search_failed',
          reason: error instanceof Error ? error.message : 'vector search failed',
        }),
      );
      return [];
    }
  }
}

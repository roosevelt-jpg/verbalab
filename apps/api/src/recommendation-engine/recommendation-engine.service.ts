import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LanguagesService } from '../languages/languages.service';
import { NeuralTtsService } from '../neural-tts/neural-tts.service';
import { VoiceMarketplaceService } from '../voice-marketplace/voice-marketplace.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { MemoryCloudService } from '../memory-cloud/memory-cloud.service';
import { EmbeddingCloudService } from '../embedding-cloud/embedding-cloud.service';
import { ApiException } from '../common/errors/api-exception';
import {
  RECOMMEND_KINDS,
  RecommendKind,
  WORKFLOW_RECIPES,
  recommendationEngineCatalog,
} from './recommendation-engine.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type RecItem = {
  id: string;
  kind: string;
  title: string;
  score: number;
  reason: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class RecommendationEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly languages: LanguagesService,
    private readonly neuralTts: NeuralTtsService,
    private readonly voiceMarketplace: VoiceMarketplaceService,
    private readonly knowledge: KnowledgeService,
    private readonly memory: MemoryCloudService,
    private readonly embeddingCloud: EmbeddingCloudService,
  ) {}

  engine() {
    return recommendationEngineCatalog();
  }

  kinds() {
    return {
      kinds: RECOMMEND_KINDS.map((id) => ({ id })),
      deferred: ['enterprise'],
      note: 'Recommendable kinds for VL-187 light rankers.',
    };
  }

  private assertKind(raw: string | undefined): RecommendKind {
    const kind = (raw?.trim() || 'language') as RecommendKind;
    if (!(RECOMMEND_KINDS as readonly string[]).includes(kind)) {
      if (kind === ('enterprise' as RecommendKind)) {
        throw new ApiException(
          'validation_error',
          'kind=enterprise is deferred — not a retail recommender OS (VL-187)',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new ApiException(
        'validation_error',
        `kind must be one of: ${RECOMMEND_KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return kind;
  }

  private textScore(query: string, ...parts: Array<string | null | undefined>): number {
    const q = query.trim().toLowerCase();
    if (!q) return 0.35;
    const hay = parts.filter(Boolean).join(' ').toLowerCase();
    if (!hay) return 0;
    let score = 0;
    if (hay.includes(q)) score += 0.55;
    const tokens = q.split(/\s+/).filter((t) => t.length > 1);
    let hits = 0;
    for (const t of tokens) {
      if (hay.includes(t)) hits += 1;
    }
    if (tokens.length) score += 0.45 * (hits / tokens.length);
    return Math.min(1, score);
  }

  private async memoryBoost(input: AuthCtx & { query?: string }): Promise<string[]> {
    if (!input.query?.trim()) return [];
    try {
      const found = await this.memory.search({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        query: input.query.trim(),
        limit: 5,
      });
      return found.hits.map((h) => h.content);
    } catch {
      return [];
    }
  }

  private async recommendLanguages(input: AuthCtx & { query?: string; k: number }): Promise<RecItem[]> {
    const [langs, workspace, memHints] = await Promise.all([
      this.languages.list(),
      this.prisma.workspace.findFirst({
        where: { id: input.workspaceId, organizationId: input.organizationId },
        select: { defaultSourceLang: true, defaultTargetLang: true },
      }),
      this.memoryBoost(input),
    ]);
    const hintText = memHints.join(' ');
    const scored = langs.map((lang) => {
      let score = this.textScore(
        input.query ?? '',
        lang.code,
        lang.nameEn,
        lang.nameNative,
        lang.family?.nameEn,
        hintText,
      );
      if (lang.tier === 'strategic_african') score += 0.2;
      if (workspace?.defaultSourceLang === lang.code || workspace?.defaultTargetLang === lang.code) {
        score += 0.25;
      }
      return {
        id: lang.code,
        kind: 'language',
        title: `${lang.nameEn} (${lang.code})`,
        score: Math.min(1, score),
        reason:
          lang.tier === 'strategic_african'
            ? 'Strategic African language match'
            : 'Registry text/tier rank',
        metadata: { tier: lang.tier, script: lang.script, family: lang.familyCode },
      } satisfies RecItem;
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, input.k);
  }

  private async recommendVoices(input: AuthCtx & { query?: string; k: number; language?: string }) {
    const [voices, listingResult, memHints] = await Promise.all([
      this.neuralTts.listVoices(
        { language: input.language },
        { organizationId: input.organizationId, workspaceId: input.workspaceId },
      ),
      this.voiceMarketplace.listPublished(input.organizationId).catch(() => ({ listings: [] as Array<{
        id: string;
        title: string;
        description: string;
        language: string | null;
      }> })),
      this.memoryBoost(input),
    ]);
    const hintText = memHints.join(' ');
    const items: RecItem[] = [];

    for (const v of voices.data) {
      const score = this.textScore(
        input.query ?? '',
        v.id,
        v.name,
        v.gender,
        ...(v.languages ?? []),
        hintText,
      );
      items.push({
        id: v.id,
        kind: 'voice',
        title: v.name,
        score: Math.min(1, score + (input.language && v.languages?.includes(input.language) ? 0.25 : 0)),
        reason: 'Neural TTS catalog rank',
        metadata: { provider: v.provider, languages: v.languages, source: 'tts' },
      });
    }

    for (const listing of listingResult.listings) {
      const score = this.textScore(
        input.query ?? '',
        listing.id,
        listing.title,
        listing.description,
        listing.language,
        hintText,
      );
      items.push({
        id: `marketplace:${listing.id}`,
        kind: 'voice',
        title: listing.title,
        score: Math.min(1, score + 0.1),
        reason: 'Voice marketplace listing',
        metadata: { listingId: listing.id, language: listing.language, source: 'marketplace' },
      });
    }

    return items.sort((a, b) => b.score - a.score).slice(0, input.k);
  }

  private async recommendContent(
    input: AuthCtx & { query?: string; k: number; useVectors: boolean },
  ): Promise<RecItem[]> {
    if (input.query?.trim() && input.useVectors) {
      const search = await this.knowledge.searchVectors({
        query: input.query.trim(),
        k: input.k,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      return search.hits.map((h) => ({
        id: h.documentId,
        kind: 'knowledge',
        title: h.filename,
        score: Math.max(0, Math.min(1, h.score)),
        reason: 'Vector Cloud nearest-neighbor',
        metadata: { chunkId: h.id, ordinal: h.ordinal, preview: h.content.slice(0, 160) },
      }));
    }

    const docs = await this.knowledge.list(input.organizationId, input.workspaceId);
    return docs.data
      .map((d) => ({
        id: d.id,
        kind: 'content',
        title: d.filename,
        score: this.textScore(input.query ?? '', d.filename, d.status),
        reason: 'Filename/status rank (no query embedding)',
        metadata: { status: d.status, chunkCount: d.chunkCount },
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.k);
  }

  private async recommendTranslation(input: AuthCtx & { query?: string; k: number }) {
    const [langs, workspace] = await Promise.all([
      this.recommendLanguages({ ...input, k: 12 }),
      this.prisma.workspace.findFirst({
        where: { id: input.workspaceId, organizationId: input.organizationId },
        select: { defaultSourceLang: true, defaultTargetLang: true },
      }),
    ]);
    const pairs: RecItem[] = [];
    const source = workspace?.defaultSourceLang ?? 'en';
    for (const lang of langs) {
      if (lang.id === source) continue;
      pairs.push({
        id: `${source}->${lang.id}`,
        kind: 'translation',
        title: `${source} → ${lang.id}`,
        score: Math.min(1, lang.score + 0.15),
        reason: 'Workspace default source + ranked target',
        metadata: { source, target: lang.id },
      });
    }
    if (workspace?.defaultTargetLang && workspace.defaultTargetLang !== source) {
      pairs.unshift({
        id: `${source}->${workspace.defaultTargetLang}`,
        kind: 'translation',
        title: `${source} → ${workspace.defaultTargetLang}`,
        score: 0.95,
        reason: 'Workspace default language pair',
        metadata: { source, target: workspace.defaultTargetLang },
      });
    }
    const dedup = new Map<string, RecItem>();
    for (const p of pairs) dedup.set(p.id, p);
    return [...dedup.values()].sort((a, b) => b.score - a.score).slice(0, input.k);
  }

  private recommendModels(input: { query?: string; k: number }): RecItem[] {
    const models = this.embeddingCloud.models().models;
    return models
      .map((m) => ({
        id: m.id,
        kind: 'model',
        title: m.id,
        score: Math.min(
          1,
          this.textScore(input.query ?? '', m.id, m.provider, ...(m.modalities ?? [])) +
            (m.default ? 0.3 : 0),
        ),
        reason: m.default ? 'Default embedding model' : 'Embedding catalog rank',
        metadata: { provider: m.provider, dimensions: m.dimensions, default: m.default },
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.k);
  }

  private recommendWorkflows(input: { query?: string; k: number }): RecItem[] {
    return WORKFLOW_RECIPES.map((w) => ({
      id: w.id,
      kind: 'workflow',
      title: w.name,
      score: this.textScore(input.query ?? '', w.id, w.name, ...w.tags, ...w.apis),
      reason: 'Fixed API recipe catalog',
      metadata: { apis: w.apis, tags: w.tags },
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.k);
  }

  async recommend(
    input: AuthCtx & {
      kind?: string;
      query?: string;
      language?: string;
      k?: number;
      retrieveMemory?: boolean;
      useVectors?: boolean;
    },
  ) {
    const kind = this.assertKind(input.kind);
    const k = Math.min(Math.max(input.k ?? 8, 1), 25);
    const useVectors = input.useVectors !== false;

    let items: RecItem[];
    switch (kind) {
      case 'language':
        items = await this.recommendLanguages({ ...input, k });
        break;
      case 'voice':
        items = await this.recommendVoices({ ...input, k });
        break;
      case 'content':
      case 'knowledge':
        items = await this.recommendContent({ ...input, k, useVectors });
        break;
      case 'translation':
        items = await this.recommendTranslation({ ...input, k });
        break;
      case 'model':
        items = this.recommendModels({ query: input.query, k });
        break;
      case 'workflow':
        items = this.recommendWorkflows({ query: input.query, k });
        break;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'recommendation_engine.recommended',
      route: 'POST /v1/recommendation-engine/recommend',
      ip: input.ip,
      metadata: { kind, count: items.length, queryLength: input.query?.length ?? 0 },
    });

    return {
      kind,
      query: input.query?.trim() || null,
      items,
      sources: {
        languages: kind === 'language' || kind === 'translation',
        voices: kind === 'voice',
        vectorCloud: kind === 'content' || kind === 'knowledge',
        memory: Boolean(input.query),
        embeddingModels: kind === 'model',
        workflows: kind === 'workflow',
      },
      honesty: {
        retailRecommenderOs: false,
        collaborativeFiltering: false,
        trainsRankingModels: false,
      },
      note: 'Light rankers over existing catalogs (VL-187). Not a retail recommender OS.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const requests = await this.prisma.auditEvent.count({
      where: {
        organizationId,
        action: 'recommendation_engine.recommended',
        createdAt: { gte: start },
      },
    });
    return {
      periodStart: start.toISOString(),
      requests,
      workspaceId,
      note: 'Recommendation Engine analytics (VL-187).',
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
      requests: analytics.requests,
      retailRecommenderOs: engine.honesty.retailRecommenderOs,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Recommendation Engine monitoring snapshot (VL-187).',
    };
  }
}

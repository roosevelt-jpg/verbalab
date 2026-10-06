import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PromptsService } from '../prompts/prompts.service';
import { EnterpriseSearchService } from '../enterprise-search/enterprise-search.service';
import { ApiException } from '../common/errors/api-exception';
import { chunkText, ragTopK } from '../knowledge/knowledge.util';
import {
  EnterpriseRagMode,
  enterpriseRagCatalog,
} from './enterprise-rag.catalog';

type Citation = {
  index: number;
  documentId: string;
  chunkId: string;
  filename: string;
  ordinal: number;
  snippet: string;
  score: number;
  collection?: string;
  contentKind?: string;
  source: string;
};

type Passage = {
  id: string;
  documentId: string;
  filename: string;
  ordinal: number;
  score: number;
  content: string;
  collection?: string;
  contentKind?: string;
  source: string;
};

@Injectable
export class EnterpriseRagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prompts: PromptsService,
    private readonly enterpriseSearch: EnterpriseSearchService,
  ) {}

  engine {
    return enterpriseRagCatalog;
  }

  private assertMode(mode: string): EnterpriseRagMode {
    if (mode !== 'keyword' && mode !== 'semantic' && mode !== 'hybrid') {
      throw new ApiException(
        'validation_error',
        'mode must be keyword, semantic, or hybrid',
        HttpStatus.BAD_REQUEST,
      );
    }
    return mode;
  }

  /** Preview chunk windows — does not persist. */
  chunk(input: { text?: string; size?: number; overlap?: number }) {
    const text = input.text ?? '';
    if (!text.trim) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const size =
      typeof input.size === 'number' && Number.isFinite(input.size)
        ? Math.min(Math.max(Math.floor(input.size), 100), 4000)
        : undefined;
    const overlap =
      typeof input.overlap === 'number' && Number.isFinite(input.overlap)
        ? Math.min(Math.max(Math.floor(input.overlap), 0), 500)
        : undefined;
    const chunks = chunkText(text, { size, overlap });
    return {
      chunkCount: chunks.length,
      size: size ?? Number(process.env.RAG_CHUNK_SIZE ?? 700),
      overlap: overlap ?? Number(process.env.RAG_CHUNK_OVERLAP ?? 80),
      chunks: chunks.map((content, i) => ({
        ordinal: i,
        chars: content.length,
        preview: content.slice(0, 160),
        content,
      })),
      note: 'Same overlapping character windows as ingest. Preview only — not stored.',
    };
  }

  /**
   * Deduplicate near-identical passages and cap total context characters.
   * Not LLM summarization / compression OS.
   */
  private optimizeContext(
    passages: Passage[],
    opts: { maxChars?: number; k?: number },
  ): { passages: Passage[]; dropped: number; maxChars: number; truncated: boolean } {
    const maxChars = Math.min(Math.max(opts.maxChars ?? 6000, 500), 20000);
    const k = Math.min(Math.max(opts.k ?? ragTopK, 1), 10);
    const seen = new Set<string>;
    const deduped: Passage[] = [];
    let dropped = 0;
    for (const p of passages) {
      const key = `${p.documentId}:${p.ordinal}:${p.content.slice(0, 80).toLowerCase}`;
      if (seen.has(key)) {
        dropped += 1;
        continue;
      }
      seen.add(key);
      deduped.push(p);
      if (deduped.length >= k * 2) break;
    }

    const kept: Passage[] = [];
    let used = 0;
    let truncated = false;
    for (const p of deduped) {
      if (kept.length >= k) break;
      const room = maxChars - used;
      if (room <= 80) {
        truncated = true;
        break;
      }
      if (p.content.length <= room) {
        kept.push(p);
        used += p.content.length;
      } else {
        kept.push({ ...p, content: p.content.slice(0, room) });
        used = maxChars;
        truncated = true;
        break;
      }
    }
    return { passages: kept, dropped, maxChars, truncated };
  }

  private toCitations(passages: Passage[]): Citation[] {
    return passages.map((p, i) => ({
      index: i + 1,
      documentId: p.documentId,
      chunkId: p.id,
      filename: p.filename,
      ordinal: p.ordinal,
      snippet: p.content.slice(0, 280),
      score: Math.round(p.score * 1000) / 1000,
      collection: p.collection,
      contentKind: p.contentKind,
      source: p.source,
    }));
  }

  async retrieve(input: {
    query: string;
    mode?: string;
    k?: number;
    maxChars?: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
    minScore?: number;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const query = input.query?.trim;
    if (!query) {
      throw new ApiException('validation_error', 'query is required', HttpStatus.BAD_REQUEST);
    }
    const mode = this.assertMode(input.mode ?? 'hybrid');
    const k = Math.min(Math.max(input.k ?? ragTopK, 1), 10);

    const search = await this.enterpriseSearch.search({
      query,
      mode,
      k: Math.min(k * 2, 20),
      collection: input.collection,
      tag: input.tag,
      contentKind: input.contentKind,
      documentId: input.documentId,
      minScore: input.minScore,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    const raw: Passage[] = search.hits.map((h) => ({
      id: h.id,
      documentId: h.documentId,
      filename: h.filename,
      ordinal: h.ordinal,
      score: h.score,
      content: h.content,
      collection: h.collection,
      contentKind: h.contentKind,
      source: h.source,
    }));

    const optimized = this.optimizeContext(raw, { maxChars: input.maxChars, k });
    const citations = this.toCitations(optimized.passages);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'enterprise_rag.retrieved',
      route: 'POST /v1/enterprise-rag/retrieve',
      ip: input.ip,
      metadata: {
        mode,
        k,
        hits: optimized.passages.length,
        dropped: optimized.dropped,
        truncated: optimized.truncated,
      },
    });

    return {
      query,
      mode,
      namespace: input.workspaceId,
      passages: optimized.passages.map((p, i) => ({
        rank: i + 1,
        id: p.id,
        documentId: p.documentId,
        filename: p.filename,
        ordinal: p.ordinal,
        score: Math.round(p.score * 1000) / 1000,
        content: p.content,
        collection: p.collection,
        contentKind: p.contentKind,
        source: p.source,
      })),
      citations,
      context: {
        passageCount: optimized.passages.length,
        droppedDuplicates: optimized.dropped,
        maxChars: optimized.maxChars,
        truncated: optimized.truncated,
        totalChars: optimized.passages.reduce((s, p) => s + p.content.length, 0),
      },
      honesty: this.engine.honesty,
      note: 'Retrieval + citation + context optimization for Enterprise RAG. Not LangChain OS.',
    };
  }

  async query(input: {
    question: string;
    mode?: string;
    k?: number;
    maxChars?: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const question = input.question?.trim;
    if (!question) {
      throw new ApiException('validation_error', 'question is required', HttpStatus.BAD_REQUEST);
    }

    const readyCount = await this.prisma.knowledgeDocument.count({
      where: { workspaceId: input.workspaceId, status: 'ready' },
    });
    if (readyCount === 0) {
      throw new ApiException(
        'validation_error',
        'No ready knowledge documents in this workspace. Upload a document first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const retrieved = await this.retrieve({
      query: question,
      mode: input.mode,
      k: input.k,
      maxChars: input.maxChars,
      collection: input.collection,
      tag: input.tag,
      contentKind: input.contentKind,
      documentId: input.documentId,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
    });

    if (retrieved.passages.length === 0) {
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'enterprise_rag.queried',
        route: 'POST /v1/enterprise-rag/query',
        ip: input.ip,
        metadata: { citations: 0, grounded: false },
      });
      return {
        answer:
          'I could not find relevant passages in the workspace knowledge base for that question.',
        citations: [],
        context: retrieved.context,
        mode: retrieved.mode,
        model: null,
        provider: null,
        grounded: true,
        honesty: this.engine.honesty,
      };
    }

    const context = retrieved.passages
      .map((p) => `[${p.rank}] (${p.filename})\n${p.content}`)
      .join('\n\n');

    const system = await this.prompts.resolve({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key: 'rag',
    });

    const chat = await this.gateway.chat({
      messages: [
        { role: 'system', content: system.body },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    await this.usage.recordChat({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, chat.totalTokens),
      provider: chat.provider,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'enterprise_rag.queried',
      route: 'POST /v1/enterprise-rag/query',
      ip: input.ip,
      metadata: {
        citations: retrieved.citations.length,
        mode: retrieved.mode,
        model: chat.model,
        provider: chat.provider,
        grounded: true,
      },
    });

    return {
      answer: chat.message.content,
      citations: retrieved.citations,
      context: retrieved.context,
      mode: retrieved.mode,
      model: chat.model,
      provider: chat.provider,
      grounded: true,
      usage: {
        prompt_tokens: chat.promptTokens,
        completion_tokens: chat.completionTokens,
        total_tokens: chat.totalTokens,
      },
      honesty: this.engine.honesty,
      note: 'Grounded answer from retrieved workspace passages only. Extends existing; not agentic RAG OS.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const [documents, chunks, retrieves, queries] = await Promise.all([
      this.prisma.knowledgeDocument.count({ where: { organizationId, workspaceId } }),
      this.prisma.knowledgeChunk.count({ where: { organizationId, workspaceId } }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'enterprise_rag.retrieved',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'enterprise_rag.queried',
          createdAt: { gte: since },
        },
      }),
    ]);
    return {
      workspace: { organizationId, workspaceId },
      documents,
      chunks,
      retrievesLast30d: retrieves,
      queriesLast30d: queries,
      note: 'Workspace-scoped Enterprise RAG analytics.',
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

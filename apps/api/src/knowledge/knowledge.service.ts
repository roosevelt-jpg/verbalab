import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { LocalStorageService } from '../documents/local-storage.service';
import { DocumentCodecService } from '../documents/document-codec.service';
import { ApiException } from '../common/errors/api-exception';
import { documentMaxBytes } from '../jobs/job.types';
import { PromptsService } from '../prompts/prompts.service';
import {
  chunkText,
  embeddingToSql,
  knowledgeMaxChunks,
  knowledgeMaxDocs,
  ragTopK,
} from './knowledge.util';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';

type RetrievedChunk = {
  id: string;
  documentId: string;
  filename: string;
  content: string;
  ordinal: number;
  score: number;
};

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly storage: LocalStorageService,
    private readonly codec: DocumentCodecService,
    private readonly prompts: PromptsService,
  ) {}

  private assertAllowedUpload(file: { size: number; mimetype: string; originalname: string }) {
    const max = documentMaxBytes();
    if (file.size <= 0) {
      throw new ApiException('validation_error', 'Empty file', HttpStatus.BAD_REQUEST);
    }
    if (file.size > max) {
      throw new ApiException(
        'validation_error',
        `File exceeds maximum size of ${max} bytes`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const name = file.originalname.toLowerCase();
    const ok =
      file.mimetype === DOCX_MIME ||
      file.mimetype === PDF_MIME ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'text/markdown' ||
      file.mimetype === 'text/x-markdown' ||
      file.mimetype === 'text/html' ||
      file.mimetype === 'application/xhtml+xml' ||
      name.endsWith('.docx') ||
      name.endsWith('.pdf') ||
      name.endsWith('.txt') ||
      name.endsWith('.md') ||
      name.endsWith('.markdown') ||
      name.endsWith('.html') ||
      name.endsWith('.htm');
    if (!ok) {
      throw new ApiException(
        'validation_error',
        'Unsupported file type. Upload DOCX, PDF, TXT, Markdown, or HTML. Images/video/audio/Office decks deferred.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private guessMime(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.docx')) return DOCX_MIME;
    if (lower.endsWith('.pdf')) return PDF_MIME;
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'text/markdown';
    if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
    return 'text/plain';
  }

  private guessContentKind(filename: string, mimeType: string, explicit?: string): string {
    if (explicit?.trim()) return explicit.trim().slice(0, 64);
    const lower = filename.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.markdown') || mimeType.includes('markdown')) {
      return 'markdown';
    }
    if (lower.endsWith('.html') || lower.endsWith('.htm') || mimeType.includes('html')) {
      return 'html';
    }
    if (lower.includes('policy')) return 'policy';
    if (lower.includes('manual')) return 'manual';
    return 'document';
  }

  private parseTags(raw?: string | string[]): string[] {
    if (!raw) return [];
    const parts = Array.isArray(raw) ? raw : raw.split(/[,|]/);
    return [
      ...new Set(
        parts
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .map((t) => t.slice(0, 48)),
      ),
    ].slice(0, 32);
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
  }

  private toDocDto(doc: {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    status: string;
    error: string | null;
    chunkCount: number;
    collection: string;
    tags: string[];
    contentKind: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: doc.id,
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      status: doc.status,
      error: doc.error,
      chunkCount: doc.chunkCount,
      collection: doc.collection,
      tags: doc.tags,
      contentKind: doc.contentKind,
      version: doc.version,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async list(
    organizationId: string,
    workspaceId: string,
    filters?: { collection?: string; tag?: string; contentKind?: string },
  ) {
    const docs = await this.prisma.knowledgeDocument.findMany({
      where: {
        organizationId,
        workspaceId,
        ...(filters?.collection ? { collection: filters.collection } : {}),
        ...(filters?.contentKind ? { contentKind: filters.contentKind } : {}),
        ...(filters?.tag ? { tags: { has: filters.tag.trim().toLowerCase() } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data: docs.map((d) => this.toDocDto(d)) };
  }

  async get(organizationId: string, workspaceId: string, documentId: string) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, organizationId, workspaceId },
    });
    if (!doc) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }
    return this.toDocDto(doc);
  }

  async remove(organizationId: string, workspaceId: string, documentId: string) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, organizationId, workspaceId },
    });
    if (!doc) {
      throw new ApiException('not_found', 'Knowledge document not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.knowledgeDocument.delete({ where: { id: doc.id } });
    await unlink(this.storage.absolutePath(doc.storageKey)).catch(() => undefined);
    return { deleted: true, id: doc.id };
  }

  async upload(input: {
    file: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
    collection?: string;
    tags?: string | string[];
    contentKind?: string;
  }) {
    this.assertAllowedUpload(input.file);

    const existing = await this.prisma.knowledgeDocument.count({
      where: { workspaceId: input.workspaceId },
    });
    if (existing >= knowledgeMaxDocs()) {
      throw new ApiException(
        'validation_error',
        `Workspace knowledge document limit is ${knowledgeMaxDocs()}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const storageKey = `knowledge/${input.organizationId}/${randomUUID()}-${this.sanitizeFilename(input.file.originalname)}`;
    await this.storage.writeBuffer(storageKey, input.file.buffer);

    const mimeType = input.file.mimetype || this.guessMime(input.file.originalname);
    const collection = (input.collection?.trim() || 'default').slice(0, 64) || 'default';
    const tags = this.parseTags(input.tags);
    const contentKind = this.guessContentKind(input.file.originalname, mimeType, input.contentKind);

    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        filename: input.file.originalname,
        mimeType,
        sizeBytes: input.file.size,
        storageKey,
        status: 'processing',
        collection,
        tags,
        contentKind,
        version: 1,
      },
    });

    try {
      await this.ingestDocument({
        documentId: doc.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ingest failed';
      await this.prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { status: 'failed', error: message.slice(0, 500) },
      });
      throw error instanceof ApiException
        ? error
        : new ApiException('provider_error', message, HttpStatus.BAD_GATEWAY);
    }

    const ready = await this.prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: doc.id } });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'knowledge.document_ready',
      route: 'POST /v1/knowledge/documents',
      ip: input.ip,
      metadata: {
        documentId: ready.id,
        filename: ready.filename,
        chunkCount: ready.chunkCount,
      },
    });

    return this.toDocDto(ready);
  }

  async ingestDocument(input: {
    documentId: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
  }) {
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

    const buffer = await this.storage.readBuffer(doc.storageKey);
    const extracted = await this.codec.extract(buffer, doc.mimeType, doc.filename);
    const fullText = extracted.paragraphs.join('\n\n');
    const chunks = chunkText(fullText).slice(0, knowledgeMaxChunks());
    if (chunks.length === 0) {
      throw new ApiException(
        'validation_error',
        'Document produced no extractable text',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.prisma.knowledgeChunk.deleteMany({ where: { documentId: doc.id } });

    const batchSize = 16;
    let totalTokens = 0;
    let lastProvider = 'openai_embeddings';
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embedded = await this.gateway.embed({
        input: batch.length === 1 ? batch[0]! : batch,
      });
      lastProvider = embedded.provider;
      totalTokens += embedded.totalTokens || batch.reduce((s, t) => s + [...t].length, 0);

      for (let j = 0; j < batch.length; j++) {
        const content = batch[j]!;
        const vector = embedded.data.find((d) => d.index === j)?.embedding;
        if (!vector || vector.length === 0) {
          throw new ApiException(
            'provider_error',
            'Embedding provider returned incomplete batch',
            HttpStatus.BAD_GATEWAY,
          );
        }
        const dims = Array.from({ length: 1536 }, (_, k) => vector[k] ?? 0);
        const id = randomUUID();

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks
            (id, organization_id, workspace_id, document_id, ordinal, content, embedding, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7::vector, CURRENT_TIMESTAMP)`,
          id,
          input.organizationId,
          input.workspaceId,
          doc.id,
          i + j,
          content,
          embeddingToSql(dims),
        );
      }
    }

    await this.usage.recordEmbeddings({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, totalTokens),
      provider: lastProvider,
    });

    await this.prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: 'ready', error: null, chunkCount: chunks.length },
    });
  }

  private async retrieve(input: {
    organizationId: string;
    workspaceId: string;
    queryEmbedding: number[];
    k: number;
  }): Promise<RetrievedChunk[]> {
    const dims = Array.from({ length: 1536 }, (_, k) => input.queryEmbedding[k] ?? 0);
    const vectorSql = embeddingToSql(dims);

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        document_id: string;
        filename: string;
        content: string;
        ordinal: number;
        score: number;
      }>
    >(
      `SELECT
        c.id,
        c.document_id,
        d.filename,
        c.content,
        c.ordinal,
        (1 - (c.embedding <=> $1::vector))::float8 AS score
      FROM knowledge_chunks c
      INNER JOIN knowledge_documents d ON d.id = c.document_id
      WHERE c.workspace_id = $2
        AND c.organization_id = $3
        AND d.status = 'ready'
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT $4`,
      vectorSql,
      input.workspaceId,
      input.organizationId,
      input.k,
    );

    return rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      filename: row.filename,
      content: row.content,
      ordinal: row.ordinal,
      score: Number(row.score),
    }));
  }

  /**
   * Nearest-neighbor / similarity search over workspace knowledge vectors.
   * Does not call chat — RAG answer path remains `query()`.
   */
  async searchVectors(input: {
    query: string;
    k?: number;
    documentId?: string;
    minScore?: number;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const query = input.query?.trim();
    if (!query) {
      throw new ApiException('validation_error', 'query is required', HttpStatus.BAD_REQUEST);
    }

    if (input.documentId) {
      const doc = await this.prisma.knowledgeDocument.findFirst({
        where: {
          id: input.documentId,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      });
      if (!doc) {
        throw new ApiException('not_found', 'document not found', HttpStatus.NOT_FOUND);
      }
    }

    const k = Math.min(Math.max(input.k ?? ragTopK(), 1), 20);
    const embedded = await this.gateway.embed({ input: query });
    await this.usage.recordEmbeddings({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, embedded.totalTokens || [...query].length),
      provider: embedded.provider,
    });

    let hits = await this.retrieve({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      queryEmbedding: embedded.data[0]?.embedding ?? [],
      k: input.documentId ? Math.min(k * 3, 60) : k,
    });

    if (input.documentId) {
      hits = hits.filter((h) => h.documentId === input.documentId).slice(0, k);
    }
    if (typeof input.minScore === 'number' && Number.isFinite(input.minScore)) {
      hits = hits.filter((h) => h.score >= input.minScore!);
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'vector_cloud.searched',
      route: 'POST /v1/vector-cloud/search',
      ip: input.ip,
      metadata: {
        hits: hits.length,
        k,
        documentId: input.documentId ?? null,
        provider: embedded.provider,
        model: embedded.model,
      },
    });

    return {
      query,
      namespace: input.workspaceId,
      collection: 'knowledge',
      backend: 'pgvector',
      metric: 'cosine',
      model: embedded.model,
      provider: embedded.provider,
      hits: hits.map((hit, i) => ({
        rank: i + 1,
        id: hit.id,
        documentId: hit.documentId,
        filename: hit.filename,
        ordinal: hit.ordinal,
        score: hit.score,
        content: hit.content,
      })),
      note: 'Nearest-neighbor cosine search over knowledge_chunks. Not hybrid BM25.',
    };
  }

  async query(input: {
    question: string;
    k?: number;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const question = input.question?.trim();
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

    const k = Math.min(Math.max(input.k ?? ragTopK(), 1), 10);
    const embedded = await this.gateway.embed({ input: question });
    await this.usage.recordEmbeddings({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, embedded.totalTokens || [...question].length),
      provider: embedded.provider,
    });

    const hits = await this.retrieve({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      queryEmbedding: embedded.data[0]?.embedding ?? [],
      k,
    });

    if (hits.length === 0) {
      return {
        answer:
          'I could not find relevant passages in the workspace knowledge base for that question.',
        citations: [],
        model: null,
        provider: null,
      };
    }

    const context = hits
      .map((hit, i) => `[${i + 1}] (${hit.filename})\n${hit.content}`)
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
      action: 'knowledge.queried',
      route: 'POST /v1/knowledge/query',
      ip: input.ip,
      metadata: {
        citations: hits.length,
        model: chat.model,
        provider: chat.provider,
      },
    });

    return {
      answer: chat.message.content,
      citations: hits.map((hit, i) => ({
        index: i + 1,
        documentId: hit.documentId,
        chunkId: hit.id,
        filename: hit.filename,
        snippet: hit.content.slice(0, 280),
        score: Math.round(hit.score * 1000) / 1000,
      })),
      model: chat.model,
      provider: chat.provider,
      usage: {
        prompt_tokens: chat.promptTokens,
        completion_tokens: chat.completionTokens,
        total_tokens: chat.totalTokens,
      },
    };
  }
}

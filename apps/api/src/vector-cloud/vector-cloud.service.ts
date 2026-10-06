import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { vectorCloudCatalog } from './vector-cloud.catalog';

@Injectable()
export class VectorCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
  ) {}

  engine() {
    return vectorCloudCatalog();
  }

  async collections(organizationId: string, workspaceId: string) {
    const [docs, vectors] = await Promise.all([
      this.prisma.knowledgeDocument.count({
        where: { organizationId, workspaceId, status: 'ready' },
      }),
      this.prisma.knowledgeChunk.count({
        where: {
          organizationId,
          workspaceId,
          // embedding nulls excluded via raw if needed; count all chunks for inventory
        },
      }),
    ]);

    return {
      collections: [
        {
          id: 'knowledge',
          name: 'Workspace Knowledge',
          namespace: workspaceId,
          backend: 'pgvector',
          dimensions: 1536,
          metric: 'cosine',
          indexType: 'hnsw',
          documentCount: docs,
          vectorCount: vectors,
          status: 'shipped',
          ingestApi: 'POST /v1/knowledge/documents',
          searchApi: 'POST /v1/vector-cloud/search',
        },
      ],
      note: 'One knowledge collection per workspace (VL-182). Multi-collection product deferred.',
    };
  }

  async namespaces(organizationId: string, workspaceId: string) {
    const vectors = await this.prisma.knowledgeChunk.count({
      where: { organizationId, workspaceId },
    });
    return {
      namespaces: [
        {
          id: workspaceId,
          kind: 'workspace',
          organizationId,
          vectorCount: vectors,
          collection: 'knowledge',
        },
      ],
      note: 'Workspace id is the vector namespace for tenant isolation (VL-182).',
    };
  }

  async indexes() {
    return {
      indexes: [
        {
          id: 'knowledge_chunks_embedding_hnsw',
          collection: 'knowledge',
          type: 'hnsw',
          metric: 'cosine',
          dimensions: 1536,
          managed: false,
          status: 'shipped',
          notes: 'Created by VL-062 migration on knowledge_chunks.embedding.',
        },
      ],
      note: 'Index create/drop/rebuild APIs deferred — migration-managed HNSW only (VL-182).',
    };
  }

  async stats(organizationId: string, workspaceId: string) {
    const [documents, chunks, readyDocs] = await Promise.all([
      this.prisma.knowledgeDocument.count({ where: { organizationId, workspaceId } }),
      this.prisma.knowledgeChunk.count({ where: { organizationId, workspaceId } }),
      this.prisma.knowledgeDocument.count({
        where: { organizationId, workspaceId, status: 'ready' },
      }),
    ]);
    return {
      namespace: workspaceId,
      collection: 'knowledge',
      documents,
      readyDocuments: readyDocs,
      vectors: chunks,
      dimensions: 1536,
      backend: 'pgvector',
      note: 'Inventory stats for workspace knowledge vectors (VL-182).',
    };
  }

  search(input: {
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
    return this.knowledge.searchVectors(input);
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);

    const [searches, stats] = await Promise.all([
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'vector_cloud.searched',
          createdAt: { gte: start },
        },
      }),
      this.stats(organizationId, workspaceId),
    ]);

    return {
      periodStart: start.toISOString(),
      searchRequests: searches,
      vectors: stats.vectors,
      readyDocuments: stats.readyDocuments,
      note: 'Vector Cloud analytics from search audits + inventory (VL-182).',
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
      searchRequests: analytics.searchRequests,
      vectors: analytics.vectors,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Vector Cloud monitoring snapshot (VL-182).',
    };
  }
}

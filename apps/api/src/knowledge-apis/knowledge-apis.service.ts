import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  KNOWLEDGE_WEBHOOK_EVENTS,
  knowledgeApiSurfaces,
  knowledgeApisCatalog,
} from './knowledge-apis.catalog';

@Injectable()
export class KnowledgeApisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return knowledgeApisCatalog();
  }

  surfaces() {
    return {
      surfaces: knowledgeApiSurfaces(),
      note: 'Knowledge Cloud REST/GraphQL/console surfaces (VL-201).',
      honesty: this.engine().honesty,
    };
  }

  graphqlCatalog() {
    const fields = knowledgeApiSurfaces().flatMap((s) =>
      s.graphql.map((name) => ({ name, product: s.product })),
    );
    return {
      endpoint: '/graphql',
      queries: fields,
      note: 'Knowledge Cloud GraphQL engine façades — CQRS catalog queries, not a full schema OS.',
    };
  }

  openapi() {
    const paths = knowledgeApiSurfaces().flatMap((s) => s.rest);
    return {
      document: '/v1/openapi.json',
      knowledgePaths: paths,
      note: 'Shared OpenAPI document includes Knowledge Cloud paths. Not a separate OpenAPI OS.',
    };
  }

  sdk() {
    return {
      package: '@verbalab/sdk',
      install: 'pnpm add @verbalab/sdk',
      methods: [
        'knowledgeProducts',
        'knowledgeBaseEngine',
        'enterpriseSearchEngine',
        'enterpriseSearch',
        'ontologyEngine',
        'taxonomyEngine',
        'enterpriseRagEngine',
        'enterpriseRagRetrieve',
        'enterpriseRagQuery',
        'knowledgeMemoryEngine',
        'knowledgeMemoryCreate',
        'knowledgeMemoryEvolve',
        'knowledgeIntelligenceEngine',
        'knowledgeIntelligenceDiscover',
        'knowledgeIntelligenceInsight',
        'knowledgeApisEngine',
        'knowledgeAnalyticsEngine',
        'knowledgeAnalyticsOverview',
        'knowledgeAnalyticsReport',
      ],
      note: 'Hand-maintained TypeScript SDK — multi-language generator deferred.',
      honesty: { sdkGeneratorOs: false },
    };
  }

  cli() {
    return {
      package: '@verbalab/cli',
      bin: 'verbalab',
      install: 'pnpm add -g @verbalab/cli',
      commands: [
        'knowledge-products',
        'knowledge-base-engine',
        'enterprise-search-engine',
        'enterprise-search',
        'ontology-engine',
        'taxonomy-engine',
        'enterprise-rag-engine',
        'enterprise-rag-retrieve',
        'enterprise-rag-query',
        'knowledge-memory-engine',
        'knowledge-intelligence-engine',
        'knowledge-intelligence-discover',
        'knowledge-apis-engine',
        'knowledge-analytics',
        'knowledge-analytics-overview',
        'knowledge-analytics-report',
      ],
      note: 'Thin CLI over SDK — not a full developer toolchain OS.',
    };
  }

  webhooks() {
    return {
      events: KNOWLEDGE_WEBHOOK_EVENTS,
      signingSecret: 'POST /v1/webhooks/signing-secret',
      delivery: 'Signed HTTP POST (X-VerbaLab-Timestamp + X-VerbaLab-Signature) via existing WebhookService',
      note: 'Event catalog for Knowledge Cloud. Full per-event fanout subscriptions deferred — job webhooks + SSE cover MVP.',
      honesty: { kafkaEventStreamingOs: false },
    };
  }

  developerPortal() {
    return {
      console: '/knowledge-apis',
      developers: '/developers',
      playground: '/playground',
      docs: '/docs/KNOWLEDGE_APIS.md',
      overviewApi: 'GET /v1/developer/overview',
      note: 'Extends VL-127 Developer Cloud — does not regenerate OAuth/sandbox clusters.',
      honesty: { regeneratesDeveloperCloud: false },
    };
  }

  async recentEvents(organizationId: string, workspaceId: string, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);
    const prefixes = [
      'knowledge.',
      'knowledge_base.',
      'enterprise_search.',
      'enterprise_rag.',
      'knowledge_memory.',
      'knowledge_intelligence.',
      'taxonomy.',
      'ontology.',
    ];
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        OR: prefixes.map((p) => ({ action: { startsWith: p } })),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return {
      workspaceId,
      events: rows.map((r) => ({
        id: r.id,
        action: r.action,
        route: r.route,
        createdAt: r.createdAt.toISOString(),
        metadata: r.metadata,
      })),
      note: 'Recent knowledge-related audit events (org-scoped). Workspace filter is advisory for residency.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [surfacesViews, streamTails] = await Promise.all([
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'knowledge_apis.surfaces',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'knowledge_apis.streamed',
          createdAt: { gte: since },
        },
      }),
    ]);
    const events = await this.recentEvents(organizationId, workspaceId, 5);
    return {
      workspace: { organizationId, workspaceId },
      surfacesViewsLast30d: surfacesViews,
      streamTailsLast30d: streamTails,
      recentEventCount: events.events.length,
      surfaceCount: knowledgeApiSurfaces().length,
      note: 'Knowledge APIs pack analytics (VL-201). ≠ VL-202 Knowledge Analytics.',
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

  async recordSurfacesView(organizationId: string, userId?: string, ip?: string) {
    await this.audit.record({
      organizationId,
      userId,
      action: 'knowledge_apis.surfaces',
      route: 'GET /v1/knowledge-apis/surfaces',
      ip,
      metadata: { surfaceCount: knowledgeApiSurfaces().length },
    });
  }

  async recordStream(organizationId: string, userId?: string, ip?: string, count = 0) {
    await this.audit.record({
      organizationId,
      userId,
      action: 'knowledge_apis.streamed',
      route: 'GET /v1/knowledge-apis/events/stream',
      ip,
      metadata: { events: count },
    });
  }
}

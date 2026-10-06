import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  intelligenceArchitectureNotes,
  intelligenceProductCatalog,
} from './intelligence-products.catalog';

@Injectable
export class IntelligenceCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  products {
    return {
      products: intelligenceProductCatalog,
      architecture: intelligenceArchitectureNotes,
      docs: '/docs/INTELLIGENCE_CLOUD.md',
    };
  }

  async overview(session: SessionContext) {
    const [usageSummary, knowledgeDocs, knowledgeChunks] = await Promise.all([
      this.usage.summary(session.organizationId),
      this.prisma.knowledgeDocument.count({
        where: { organizationId: session.organizationId },
      }),
      this.prisma.knowledgeChunk.count({
        where: { organizationId: session.organizationId },
      }),
    ]);

    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      workspace: {
        knowledgeDocuments: knowledgeDocs,
        knowledgeChunks,
      },
      products: intelligenceProductCatalog,
      architecture: intelligenceArchitectureNotes,
      deferred: {
        customAiKernel: true,
        speechEmbeddings: true,
        imageEmbeddings: true,
        videoEmbeddings: true,
        crossModalEmbeddings: true,
        embeddingCloudProduct: false,
        vectorCloudProduct: false,
        dedicatedVectorDb: true,
        memoryCloud: false,
        knowledgeGraphProduct: false,
        knowledgeGraphOs: true,
        contextEngine: false,
        reasoningCloudProduct: false,
        customReasoner: true,
        recommendationEngine: false,
        promptIntelligence: false,
        decisionEngineProduct: false,
        decisionEngineOs: true,
        orchestrationProduct: false,
        multiCloudAgentOs: true,
        intelligenceAnalyticsProduct: false,
        agentOs: true,
      },
      links: {
        intelligenceCloud: '/intelligence-cloud',
        embeddings: '/embedding-cloud',
        embeddingCloud: '/embedding-cloud',
        vectorCloud: '/vector-cloud',
        memoryCloud: '/memory-cloud',
        knowledgeGraph: '/knowledge-graph',
        contextEngine: '/context-engine',
        reasoningCloud: '/reasoning-cloud',
        recommendationEngine: '/recommendation-engine',
        promptIntelligence: '/prompt-intelligence',
        decisionEngine: '/decision-engine',
        aiOrchestration: '/ai-orchestration',
        intelligenceAnalytics: '/intelligence-analytics',
        prompts: '/prompts',
        knowledge: '/knowledge',
        chat: '/chat',
        language: '/language',
        speech: '/speech',
        voiceCloud: '/voice-cloud',
        usage: '/usage',
        billing: '/billing',
        analytics: '/analytics',
        graphql: '/graphql',
        playground: '/playground',
      },
      docs: '/docs/INTELLIGENCE_CLOUD.md',
      note: 'Hub over LLM gateway + embeddings + RAG. Not a custom AI kernel / reasoner OS.',
    };
  }
}

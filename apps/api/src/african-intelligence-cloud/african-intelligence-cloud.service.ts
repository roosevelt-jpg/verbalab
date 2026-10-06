import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  africanIntelligenceArchitectureNotes,
  africanIntelligenceHonesty,
  africanIntelligenceProductCatalog,
  africanIntelligenceRoutingTable,
} from './african-intelligence-cloud.catalog';

@Injectable()
export class AfricanIntelligenceCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi African Intelligence Cloud',
      products: africanIntelligenceProductCatalog(),
      architecture: africanIntelligenceArchitectureNotes(),
      honesty: africanIntelligenceHonesty(),
      safety: {
        traditionalKnowledgeConsentRequired: true,
        extractiveTraditionalKnowledgeScrape: false,
        notMedicalAdvice: true,
        notInvestmentAdvice: true,
        officialGuidanceMustBeSourced: true,
        fairLendingConsiderationsFlagged: true,
        staleGuidanceRiskNoted: true,
        note:
          'Volume 12 README: traditional knowledge needs provenance/consent; healthcare/finance/government outputs need behavioral guardrails — not buried ToS disclaimers. Global Intelligence OS is deferred past Production Audit.',
      },
      docs: '/docs/AFRICAN_INTELLIGENCE_CLOUD.md',
      note:
        'African Intelligence Cloud Foundation (VL-260). Extends Language/Knowledge/Intelligence clouds. Not Neo4j OS, Digital Twin OS, extractive scrape OS, or Global Intelligence OS.',
    };
  }

  routing() {
    return {
      routes: africanIntelligenceRoutingTable(),
      products: africanIntelligenceProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: africanIntelligenceHonesty(),
      note: 'Static African Intelligence discovery catalog for Foundation.',
      docs: '/docs/AFRICAN_INTELLIGENCE_CLOUD.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
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
      products: africanIntelligenceProductCatalog(),
      architecture: africanIntelligenceArchitectureNotes(),
      honesty: africanIntelligenceHonesty(),
      safety: {
        traditionalKnowledgeConsentRequired: true,
        extractiveTraditionalKnowledgeScrape: false,
        notMedicalAdvice: true,
        notInvestmentAdvice: true,
        officialGuidanceMustBeSourced: true,
        fairLendingConsiderationsFlagged: true,
        staleGuidanceRiskNoted: true,
        note:
          'Traditional knowledge requires consent/attribution. Domain engines carry healthcare/finance/government safety flags. Global Intelligence OS rejected in this volume.',
      },
      deferred: {
        neo4jOs: false,
        worldsLargestScrapeOs: false,
        digitalTwinOs: false,
        globalIntelligenceOs: true,
        coverageComplete: true,
        regeneratesVolumes1to11: false,
      },
      links: {
        africanIntelligenceCloud: '/african-intelligence-cloud',
        africanLanguageRegistry: '/african-language-registry',
        culturalIntelligence: '/cultural-intelligence',
        africanKnowledgeGraph: '/african-knowledge-graph',
        governmentIntelligence: '/government-intelligence',
        healthcareIntelligence: '/healthcare-intelligence',
        financialIntelligence: '/financial-intelligence',
        educationIntelligence: '/education-intelligence',
        agriculturalIntelligence: '/agricultural-intelligence',
        tourismHeritageIntelligence: '/tourism-heritage-intelligence',
        languageCloud: '/language',
        knowledgeCloud: '/knowledge-cloud',
        intelligenceCloud: '/intelligence-cloud',
        dialects: '/dialects',
        accents: '/accents',
      },
      docs: '/docs/AFRICAN_INTELLIGENCE_CLOUD.md',
      note:
        'African Intelligence Cloud (VL-260–270). Discovery hub over language/culture/graph/domain engines; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = africanIntelligenceProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: africanIntelligenceArchitectureNotes(),
      honesty: africanIntelligenceHonesty(),
      note: 'African Intelligence Cloud monitoring snapshot (VL-260).',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  researchAreasCatalog,
  researchCloudArchitectureNotes,
  researchCloudHonesty,
  researchCloudProductCatalog,
  researchCloudRoutingTable,
} from './research-cloud.catalog';

@Injectable()
export class ResearchCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'VerbaLab Research Cloud',
      products: researchCloudProductCatalog(),
      researchAreas: researchAreasCatalog(),
      architecture: researchCloudArchitectureNotes(),
      honesty: researchCloudHonesty(),
      safety: {
        syntheticLabelRequired: true,
        traditionalKnowledgeConsentRequired: true,
        aiSovereigntyOs: false,
        note:
          'Volume 13 README: label synthetic data used with Volume 12 sensitive domains; require Volume 12 consent fields before open-releasing traditional knowledge. AI Sovereignty Cloud deferred to Volume 14+.',
      },
      docs: '/docs/RESEARCH_CLOUD.md',
      note:
        'Research Cloud Foundation (VL-271). Extends Intelligence/Knowledge/Foundation Model clouds. Not W&B, Hugging Face hub, DOI registry, USPTO, or MLflow OS. AI Sovereignty OS deferred.',
    };
  }

  routing() {
    return {
      routes: researchCloudRoutingTable(),
      products: researchCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: researchCloudHonesty(),
      note: 'Static Research Cloud discovery catalog for Foundation.',
      docs: '/docs/RESEARCH_CLOUD.md',
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
      products: researchCloudProductCatalog(),
      researchAreas: researchAreasCatalog(),
      architecture: researchCloudArchitectureNotes(),
      honesty: researchCloudHonesty(),
      safety: {
        syntheticLabelRequired: true,
        traditionalKnowledgeConsentRequired: true,
        aiSovereigntyOs: false,
        note:
          'Synthetic artifacts must stay labeled. Traditional-knowledge open releases require attested consent. AI Sovereignty Cloud rejected in this volume.',
      },
      deferred: {
        weightsAndBiasesOs: true,
        huggingFaceHubOs: true,
        doiRegistryOs: true,
        usptoOs: true,
        mlflowOs: true,
        publicLeaderboardOs: true,
        aiSovereigntyOs: true,
        regeneratesVolumes1to12: false,
      },
      links: {
        researchCloud: '/research-cloud',
        experimentPlatform: '/experiment-platform',
        syntheticDataPlatform: '/synthetic-data-platform',
        benchmarkPlatform: '/benchmark-platform',
        evaluationPlatform: '/evaluation-platform',
        aiPublicationPlatform: '/ai-publication-platform',
        patentInnovationPlatform: '/patent-innovation-platform',
        openSciencePlatform: '/open-science-platform',
        researchAnalytics: '/research-analytics',
        intelligenceCloud: '/intelligence-cloud',
        knowledgeCloud: '/knowledge-cloud',
        foundationModelCloud: '/foundation-model-cloud',
      },
      docs: '/docs/RESEARCH_CLOUD.md',
      note:
        'Research Cloud (VL-271–280). Discovery hub over experiment/synthetic/benchmark/evaluation/publication/patent/open-science/analytics; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = researchCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      researchAreas: researchAreasCatalog().map((a) => ({ id: a.id, status: a.status })),
      architecture: researchCloudArchitectureNotes(),
      honesty: researchCloudHonesty(),
      note: 'Research Cloud monitoring snapshot (VL-271).',
    };
  }
}

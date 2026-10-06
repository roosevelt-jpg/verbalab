import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  platformEngineeringCloudArchitectureNotes,
  platformEngineeringCloudHonesty,
  platformEngineeringCloudProductCatalog,
  platformEngineeringCloudRoutingTable,
} from './platform-engineering-cloud.catalog';

@Injectable()
export class PlatformEngineeringCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi Platform Engineering Cloud',
      products: platformEngineeringCloudProductCatalog(),
      architecture: platformEngineeringCloudArchitectureNotes(),
      honesty: platformEngineeringCloudHonesty(),
      safety: {
        controlPlaneOs: false,
        dataPlaneOs: false,
        aiCloudOs: false,
        backstageOs: false,
        argoCdOs: false,
        fluxOs: false,
        snykOs: false,
        datadogOs: false,
        finopsOs: false,
        note:
          'Platform docs: internal engineering tooling. FinOps pairs GPU budgets; Supply Chain inventories workspace deps; GitOps is readiness over Fly — not Argo/Flux OS. Control Plane rejected here.',
      },
      docs: '/docs/PLATFORM_ENGINEERING_CLOUD.md',
      note:
        'Platform Engineering Foundation. Internal IDP over existing systems. Not Backstage/Argo/K8s/Snyk/Datadog/AI Cloud OS.',
    };
  }

  routing() {
    return {
      routes: platformEngineeringCloudRoutingTable(),
      products: platformEngineeringCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      honesty: platformEngineeringCloudHonesty(),
      note: 'Static Platform Engineering Cloud discovery catalog for Foundation.',
      docs: '/docs/PLATFORM_ENGINEERING_CLOUD.md',
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
      products: platformEngineeringCloudProductCatalog(),
      architecture: platformEngineeringCloudArchitectureNotes(),
      honesty: platformEngineeringCloudHonesty(),
      safety: {
        controlPlaneOs: false,
        dataPlaneOs: false,
        aiCloudOs: false,
        note:
          'Internal IDP honesty enforced. Control Plane / Data Plane / AI Cloud OS deferred.',
      },
      deferred: {
        controlPlaneOs: true,
        dataPlaneOs: true,
        aiCloudOs: true,
        regeneratesVolumes1to15: false,
      },
      links: {
        platformEngineeringCloud: '/platform-engineering-cloud',
        internalDeveloperPortal: '/internal-developer-portal',
        serviceCatalog: '/service-catalog',
        goldenPathPlatform: '/golden-path-platform',
        gitopsPlatform: '/gitops-platform',
        releaseEngineering: '/release-engineering',
        reliabilityEngineering: '/reliability-engineering',
        finopsPlatform: '/finops-platform',
        supplyChainSecurity: '/supply-chain-security',
        developerExperiencePlatform: '/developer-experience-platform',
        platformEngineeringAnalytics: '/platform-engineering-analytics',
        developerCloud: '/developer-cloud',
        gpuPlatform: '/gpu-platform',
        observability: '/v1/metrics/translate',
      },
      docs: '/docs/PLATFORM_ENGINEERING_CLOUD.md',
      note:
        'Platform Engineering Cloud (–313). Discovery hub over portal/catalog/golden-paths/gitops/release/reliability/finops/supply-chain/devex/analytics; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = platformEngineeringCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: platformEngineeringCloudArchitectureNotes(),
      honesty: platformEngineeringCloudHonesty(),
      note: 'Platform Engineering Cloud monitoring snapshot.',
    };
  }
}

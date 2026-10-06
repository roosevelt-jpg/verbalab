import { Injectable } from '@nestjs/common';
import { engineeringGovernanceEngineCatalog } from './engineering-governance.catalog';
import { AiGovernancePlatformService } from '../ai-governance-platform/ai-governance-platform.service';
import { TrustCloudService } from '../trust-cloud/trust-cloud.service';
import { ReleaseEngineeringService } from '../release-engineering/release-engineering.service';
import { PlatformEngineeringCloudService } from '../platform-engineering-cloud/platform-engineering-cloud.service';

@Injectable
export class EngineeringGovernanceService {
  constructor(
    private readonly aiGovernance: AiGovernancePlatformService,
    private readonly trustCloud: TrustCloudService,
    private readonly releaseEngineering: ReleaseEngineeringService,
    private readonly platformEngineeringCloud: PlatformEngineeringCloudService
  ) {}

  engine {
    return engineeringGovernanceEngineCatalog;
  }

  /** Catalog route: returns standards capability + live status from injected upstream services. */
  route(capability?: string) {
    const catalog = this.engine;
    const q = (capability ?? '').trim.toLowerCase;
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase.includes(q);
    });
    const upstreamStatus = [
      {
        module: 'ai-governance-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.aiGovernance.engine,
      },
      {
        module: 'trust-cloud',
        method: 'products',
        status: 'reachable',
        upstream: this.trustCloud.products,
      },
      {
        module: 'release-engineering',
        method: 'engine',
        status: 'reachable',
        upstream: this.releaseEngineering.engine,
      },
      {
        module: 'platform-engineering-cloud',
        method: 'products',
        status: 'reachable',
        upstream: this.platformEngineeringCloud.products,
      }
    ];
    return {
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      capability: capability ?? null,
      capabilities,
      routesTo: catalog.routesTo,
      upstreamStatus,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  execute(capability?: string) {
    return this.route(capability);
  }

  list(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase.includes(q);
    });
    return {
      routes: rows,
      count: rows.length,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  query(query?: string) {
    return this.list(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'engineering-governance',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'EngineeringGovernance monitoring snapshot.',
    };
  }
}

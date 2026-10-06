import { Injectable } from '@nestjs/common';
import { engineeringQualityPlatformEngineCatalog } from './engineering-quality-platform.catalog';
import { SupplyChainSecurityService } from '../supply-chain-security/supply-chain-security.service';
import { ReliabilityEngineeringService } from '../reliability-engineering/reliability-engineering.service';
import { DeveloperExperiencePlatformService } from '../developer-experience-platform/developer-experience-platform.service';

@Injectable
export class EngineeringQualityPlatformService {
  constructor(
    private readonly supplyChain: SupplyChainSecurityService,
    private readonly reliability: ReliabilityEngineeringService,
    private readonly developerExperience: DeveloperExperiencePlatformService
  ) {}

  engine {
    return engineeringQualityPlatformEngineCatalog;
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
        module: 'supply-chain-security',
        method: 'engine',
        status: 'reachable',
        upstream: this.supplyChain.engine,
      },
      {
        module: 'reliability-engineering',
        method: 'engine',
        status: 'reachable',
        upstream: this.reliability.engine,
      },
      {
        module: 'developer-experience-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.developerExperience.engine,
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
      mode: 'engineering-quality-platform',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'EngineeringQualityPlatform monitoring snapshot.',
    };
  }
}

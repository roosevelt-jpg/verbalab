import { Injectable } from '@nestjs/common';
import { architectureGovernanceEngineCatalog } from './architecture-governance.catalog';
import { PlatformEngineeringCloudService } from '../platform-engineering-cloud/platform-engineering-cloud.service';
import { DeveloperExperiencePlatformService } from '../developer-experience-platform/developer-experience-platform.service';

@Injectable()
export class ArchitectureGovernanceService {
  constructor(
    private readonly platformEngineeringCloud: PlatformEngineeringCloudService,
    private readonly developerExperience: DeveloperExperiencePlatformService
  ) {}

  engine() {
    return architectureGovernanceEngineCatalog();
  }

  /** Catalog route: returns standards capability + live status from injected upstream services. */
  route(capability?: string) {
    const catalog = this.engine();
    const q = (capability ?? '').trim().toLowerCase();
    const capabilities = catalog.capabilities.filter((c) => {
      if (!q) return true;
      return c.id.includes(q) || c.name.toLowerCase().includes(q);
    });
    const upstreamStatus = [
      {
        module: 'platform-engineering-cloud',
        method: 'products',
        status: 'reachable',
        upstream: this.platformEngineeringCloud.products(),
      },
      {
        module: 'developer-experience-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.developerExperience.engine(),
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
    const catalog = this.engine();
    const q = (query ?? '').trim().toLowerCase();
    const rows = catalog.routes.filter((row) => {
      if (!q) return true;
      return JSON.stringify(row).toLowerCase().includes(q);
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

  adrSeries() {
    return {
      pointsAt: 'docs/adr/',
      existingAdrCountAtShip: 246,
      adrFactoryOs: false,
      massGeneration: false,
      note: 'ADR workflow catalog points at existing docs/adr — count is observational, not a factory.',
    };
  }

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'architecture-governance',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'ArchitectureGovernance monitoring snapshot.',
    };
  }
}

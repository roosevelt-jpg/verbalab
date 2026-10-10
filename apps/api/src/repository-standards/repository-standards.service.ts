import { Injectable } from '@nestjs/common';
import { repositoryStandardsEngineCatalog } from './repository-standards.catalog';
import { DeveloperExperiencePlatformService } from '../developer-experience-platform/developer-experience-platform.service';
import { GoldenPathPlatformService } from '../golden-path-platform/golden-path-platform.service';
import { GitopsPlatformService } from '../gitops-platform/gitops-platform.service';

@Injectable()
export class RepositoryStandardsService {
  constructor(
    private readonly developerExperience: DeveloperExperiencePlatformService,
    private readonly goldenPath: GoldenPathPlatformService,
    private readonly gitops: GitopsPlatformService
  ) {}

  engine() {
    return repositoryStandardsEngineCatalog();
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
        module: 'developer-experience-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.developerExperience.engine(),
      },
      {
        module: 'golden-path-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.goldenPath.engine(),
      },
      {
        module: 'gitops-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.gitops.engine(),
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

  monitoring() {
    const catalog = this.engine();
    return {
      mode: 'repository-standards',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'RepositoryStandards monitoring snapshot.',
    };
  }
}

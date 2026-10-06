import { Injectable } from '@nestjs/common';
import { infrastructureEngineeringStandardsEngineCatalog } from './infrastructure-engineering-standards.catalog';
import { FinopsPlatformService } from '../finops-platform/finops-platform.service';
import { SecretsCertificatePlatformService } from '../secrets-certificate-platform/secrets-certificate-platform.service';
import { GpuPlatformService } from '../gpu-platform/gpu-platform.service';
import { GitopsPlatformService } from '../gitops-platform/gitops-platform.service';
import { GlobalDeploymentControllerService } from '../global-deployment-controller/global-deployment-controller.service';

@Injectable
export class InfrastructureEngineeringStandardsService {
  constructor(
    private readonly finops: FinopsPlatformService,
    private readonly secrets: SecretsCertificatePlatformService,
    private readonly gpuPlatform: GpuPlatformService,
    private readonly gitops: GitopsPlatformService,
    private readonly globalDeployment: GlobalDeploymentControllerService
  ) {}

  engine {
    return infrastructureEngineeringStandardsEngineCatalog;
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
        module: 'finops-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.finops.engine,
      },
      {
        module: 'secrets-certificate-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.secrets.engine,
      },
      {
        module: 'gpu-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.gpuPlatform.engine,
      },
      {
        module: 'gitops-platform',
        method: 'engine',
        status: 'reachable',
        upstream: this.gitops.engine,
      },
      {
        module: 'global-deployment-controller',
        method: 'engine',
        status: 'reachable',
        upstream: this.globalDeployment.engine,
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
      mode: 'infrastructure-engineering-standards',
      count: catalog.routes.length,
      engineeringOsForHumansAndCursor: true,
      customerFacingProductCloud: false,
      architectureKnowledgeBaseOs: false,
      adrFactoryOs: false,
      routesTo: catalog.routesTo,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'InfrastructureEngineeringStandards monitoring snapshot.',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { GlobalDeploymentControllerService } from '../global-deployment-controller.service';
import {
  GlobalDeploymentControllerCatalogPort,
  GlobalDeploymentControllerEngineBundle,
  GlobalDeploymentControllerProductRow,
} from './ports';

@Injectable
export class NestGlobalDeploymentControllerCatalogAdapter implements GlobalDeploymentControllerCatalogPort {
  constructor(private readonly service: GlobalDeploymentControllerService) {}

  engine: GlobalDeploymentControllerEngineBundle {
    return this.service.engine;
  }

  listProducts: GlobalDeploymentControllerProductRow[] {
    const bundle = this.engine as {
      products?: GlobalDeploymentControllerProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/global-deployment-controller`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'global-deployment-controller',
        name: 'Global Deployment Controller',
        status: 'shipped',
        api: 'GET /v1/global-deployment-controller/engine',
        console: '/global-deployment-controller',
        notes: ' shipped.',
      },
    ];
  }
}

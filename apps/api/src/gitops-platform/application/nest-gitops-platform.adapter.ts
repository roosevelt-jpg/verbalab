import { Injectable } from '@nestjs/common';
import { GitopsPlatformService } from '../gitops-platform.service';
import {
  GitopsPlatformCatalogPort,
  GitopsPlatformEngineBundle,
  GitopsPlatformProductRow,
} from './ports';

@Injectable()
export class NestGitopsPlatformCatalogAdapter implements GitopsPlatformCatalogPort {
  constructor(private readonly service: GitopsPlatformService) {}

  engine(): GitopsPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): GitopsPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: GitopsPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/gitops-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'gitops-platform',
        name: 'GitOps Platform',
        status: 'shipped',
        api: 'GET /v1/gitops-platform/engine',
        console: '/gitops-platform',
        notes: ' shipped.',
      },
    ];
  }
}

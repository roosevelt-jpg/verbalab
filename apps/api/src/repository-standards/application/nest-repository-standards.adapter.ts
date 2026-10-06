import { Injectable } from '@nestjs/common';
import { RepositoryStandardsService } from '../repository-standards.service';
import {
  RepositoryStandardsCatalogPort,
  RepositoryStandardsEngineBundle,
  RepositoryStandardsProductRow,
} from './ports';

@Injectable()
export class NestRepositoryStandardsCatalogAdapter implements RepositoryStandardsCatalogPort {
  constructor(private readonly service: RepositoryStandardsService) {}

  engine(): RepositoryStandardsEngineBundle {
    return this.service.engine();
  }

  listProducts(): RepositoryStandardsProductRow[] {
    const bundle = this.engine() as {
      products?: RepositoryStandardsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/repository-standards`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'repository-standards',
        name: 'Repository Standards',
        status: 'shipped',
        api: 'GET /v1/repository-standards/engine',
        console: '/repository-standards',
        notes: 'VL-347 shipped.',
      },
    ];
  }
}

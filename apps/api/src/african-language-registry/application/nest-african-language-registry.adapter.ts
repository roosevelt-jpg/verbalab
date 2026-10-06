import { Injectable } from '@nestjs/common';
import { AfricanLanguageRegistryService } from '../african-language-registry.service';
import {
  AfricanLanguageRegistryCatalogPort,
  AfricanLanguageRegistryEngineBundle,
  AfricanLanguageRegistryProductRow,
} from './ports';

@Injectable()
export class NestAfricanLanguageRegistryCatalogAdapter implements AfricanLanguageRegistryCatalogPort {
  constructor(private readonly service: AfricanLanguageRegistryService) {}

  engine(): AfricanLanguageRegistryEngineBundle {
    return this.service.engine();
  }

  listProducts(): AfricanLanguageRegistryProductRow[] {
    const bundle = this.engine() as { products?: AfricanLanguageRegistryProductRow[]; capabilities?: AfricanLanguageRegistryProductRow[] };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/african-language-registry`,
        notes: (c as { notes?: string }).notes ?? '',
      }));
    }
    return [
      {
        id: 'african-language-registry',
        name: 'African Language Registry',
        status: 'shipped',
        api: 'GET /v1/african-language-registry/engine',
        console: '/african-language-registry',
        notes: 'VL-261 shipped.',
      },
    ];
  }
}

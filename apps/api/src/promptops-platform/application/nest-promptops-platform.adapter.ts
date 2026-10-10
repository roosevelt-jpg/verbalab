import { Injectable } from '@nestjs/common';
import { PromptopsPlatformService } from '../promptops-platform.service';
import {
  PromptopsPlatformCatalogPort,
  PromptopsPlatformEngineBundle,
  PromptopsPlatformProductRow,
} from './ports';

@Injectable()
export class NestPromptopsPlatformCatalogAdapter implements PromptopsPlatformCatalogPort {
  constructor(private readonly service: PromptopsPlatformService) {}

  engine(): PromptopsPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): PromptopsPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: PromptopsPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/promptops-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'promptops-platform',
        name: 'PromptOps Platform',
        status: 'shipped',
        api: 'GET /v1/promptops-platform/engine',
        console: '/promptops-platform',
        notes: ' shipped.',
      },
    ];
  }
}

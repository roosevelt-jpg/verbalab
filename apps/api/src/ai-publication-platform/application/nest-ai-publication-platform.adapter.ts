import { Injectable } from '@nestjs/common';
import { AiPublicationPlatformService } from '../ai-publication-platform.service';
import {
  AiPublicationPlatformCatalogPort,
  AiPublicationPlatformEngineBundle,
  AiPublicationPlatformProductRow,
} from './ports';

@Injectable
export class NestAiPublicationPlatformCatalogAdapter implements AiPublicationPlatformCatalogPort {
  constructor(private readonly service: AiPublicationPlatformService) {}

  engine: AiPublicationPlatformEngineBundle {
    return this.service.engine;
  }

  listProducts: AiPublicationPlatformProductRow[] {
    const bundle = this.engine as {
      products?: AiPublicationPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/ai-publication-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-publication-platform',
        name: 'AI Publication Platform',
        status: 'shipped',
        api: 'GET /v1/ai-publication-platform/engine',
        console: '/ai-publication-platform',
        notes: ' shipped.',
      },
    ];
  }
}

import { Injectable } from '@nestjs/common';
import { AiEngineeringStandardsService } from '../ai-engineering-standards.service';
import {
  AiEngineeringStandardsCatalogPort,
  AiEngineeringStandardsEngineBundle,
  AiEngineeringStandardsProductRow,
} from './ports';

@Injectable()
export class NestAiEngineeringStandardsCatalogAdapter implements AiEngineeringStandardsCatalogPort {
  constructor(private readonly service: AiEngineeringStandardsService) {}

  engine(): AiEngineeringStandardsEngineBundle {
    return this.service.engine();
  }

  listProducts(): AiEngineeringStandardsProductRow[] {
    const bundle = this.engine() as {
      products?: AiEngineeringStandardsProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/ai-engineering-standards`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'ai-engineering-standards',
        name: 'AI Engineering Standards',
        status: 'shipped',
        api: 'GET /v1/ai-engineering-standards/engine',
        console: '/ai-engineering-standards',
        notes: ' shipped.',
      },
    ];
  }
}

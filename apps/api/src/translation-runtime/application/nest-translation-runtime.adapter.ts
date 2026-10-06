import { Injectable } from '@nestjs/common';
import { TranslationRuntimeService } from '../translation-runtime.service';
import {
  TranslationRuntimeCatalogPort,
  TranslationRuntimeEngineBundle,
  TranslationRuntimeProductRow,
} from './ports';

@Injectable
export class NestTranslationRuntimeCatalogAdapter implements TranslationRuntimeCatalogPort {
  constructor(private readonly service: TranslationRuntimeService) {}

  engine: TranslationRuntimeEngineBundle {
    return this.service.engine;
  }

  listProducts: TranslationRuntimeProductRow[] {
    const bundle = this.engine as {
      products?: TranslationRuntimeProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/translation-runtime`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'translation-runtime',
        name: 'Translation Runtime',
        status: 'shipped',
        api: 'GET /v1/translation-runtime/engine',
        console: '/translation-runtime',
        notes: ' shipped.',
      },
    ];
  }
}

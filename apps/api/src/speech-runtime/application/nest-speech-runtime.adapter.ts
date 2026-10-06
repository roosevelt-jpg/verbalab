import { Injectable } from '@nestjs/common';
import { SpeechRuntimeService } from '../speech-runtime.service';
import {
  SpeechRuntimeCatalogPort,
  SpeechRuntimeEngineBundle,
  SpeechRuntimeProductRow,
} from './ports';

@Injectable
export class NestSpeechRuntimeCatalogAdapter implements SpeechRuntimeCatalogPort {
  constructor(private readonly service: SpeechRuntimeService) {}

  engine: SpeechRuntimeEngineBundle {
    return this.service.engine;
  }

  listProducts: SpeechRuntimeProductRow[] {
    const bundle = this.engine as {
      products?: SpeechRuntimeProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/speech-runtime`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'speech-runtime',
        name: 'Speech Runtime',
        status: 'shipped',
        api: 'GET /v1/speech-runtime/engine',
        console: '/speech-runtime',
        notes: ' shipped.',
      },
    ];
  }
}

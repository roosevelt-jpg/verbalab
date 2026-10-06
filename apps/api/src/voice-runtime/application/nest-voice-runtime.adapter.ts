import { Injectable } from '@nestjs/common';
import { VoiceRuntimeService } from '../voice-runtime.service';
import {
  VoiceRuntimeCatalogPort,
  VoiceRuntimeEngineBundle,
  VoiceRuntimeProductRow,
} from './ports';

@Injectable
export class NestVoiceRuntimeCatalogAdapter implements VoiceRuntimeCatalogPort {
  constructor(private readonly service: VoiceRuntimeService) {}

  engine: VoiceRuntimeEngineBundle {
    return this.service.engine;
  }

  listProducts: VoiceRuntimeProductRow[] {
    const bundle = this.engine as {
      products?: VoiceRuntimeProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/voice-runtime`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'voice-runtime',
        name: 'Voice Runtime',
        status: 'shipped',
        api: 'GET /v1/voice-runtime/engine',
        console: '/voice-runtime',
        notes: ' shipped.',
      },
    ];
  }
}

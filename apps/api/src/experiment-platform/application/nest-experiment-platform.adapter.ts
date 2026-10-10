import { Injectable } from '@nestjs/common';
import { ExperimentPlatformService } from '../experiment-platform.service';
import {
  ExperimentPlatformCatalogPort,
  ExperimentPlatformEngineBundle,
  ExperimentPlatformProductRow,
} from './ports';

@Injectable()
export class NestExperimentPlatformCatalogAdapter implements ExperimentPlatformCatalogPort {
  constructor(private readonly service: ExperimentPlatformService) {}

  engine(): ExperimentPlatformEngineBundle {
    return this.service.engine();
  }

  listProducts(): ExperimentPlatformProductRow[] {
    const bundle = this.engine() as {
      products?: ExperimentPlatformProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: `/experiment-platform`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'experiment-platform',
        name: 'Experiment Platform',
        status: 'shipped',
        api: 'GET /v1/experiment-platform/engine',
        console: '/experiment-platform',
        notes: ' shipped.',
      },
    ];
  }
}

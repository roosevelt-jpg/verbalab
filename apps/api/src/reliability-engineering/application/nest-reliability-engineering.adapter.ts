import { Injectable } from '@nestjs/common';
import { ReliabilityEngineeringService } from '../reliability-engineering.service';
import {
  ReliabilityEngineeringCatalogPort,
  ReliabilityEngineeringEngineBundle,
  ReliabilityEngineeringProductRow,
} from './ports';

@Injectable()
export class NestReliabilityEngineeringCatalogAdapter implements ReliabilityEngineeringCatalogPort {
  constructor(private readonly service: ReliabilityEngineeringService) {}

  engine(): ReliabilityEngineeringEngineBundle {
    return this.service.engine();
  }

  listProducts(): ReliabilityEngineeringProductRow[] {
    const bundle = this.engine() as {
      products?: ReliabilityEngineeringProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/reliability-engineering`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'reliability-engineering',
        name: 'Reliability Engineering',
        status: 'shipped',
        api: 'GET /v1/reliability-engineering/engine',
        console: '/reliability-engineering',
        notes: ' shipped.',
      },
    ];
  }
}

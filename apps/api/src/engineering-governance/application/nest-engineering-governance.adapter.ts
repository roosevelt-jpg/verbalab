import { Injectable } from '@nestjs/common';
import { EngineeringGovernanceService } from '../engineering-governance.service';
import {
  EngineeringGovernanceCatalogPort,
  EngineeringGovernanceEngineBundle,
  EngineeringGovernanceProductRow,
} from './ports';

@Injectable()
export class NestEngineeringGovernanceCatalogAdapter implements EngineeringGovernanceCatalogPort {
  constructor(private readonly service: EngineeringGovernanceService) {}

  engine(): EngineeringGovernanceEngineBundle {
    return this.service.engine();
  }

  listProducts(): EngineeringGovernanceProductRow[] {
    const bundle = this.engine() as {
      products?: EngineeringGovernanceProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/engineering-governance`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'engineering-governance',
        name: 'Engineering Governance',
        status: 'shipped',
        api: 'GET /v1/engineering-governance/engine',
        console: '/engineering-governance',
        notes: 'VL-345 shipped.',
      },
    ];
  }
}

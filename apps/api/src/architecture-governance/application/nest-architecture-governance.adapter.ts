import { Injectable } from '@nestjs/common';
import { ArchitectureGovernanceService } from '../architecture-governance.service';
import {
  ArchitectureGovernanceCatalogPort,
  ArchitectureGovernanceEngineBundle,
  ArchitectureGovernanceProductRow,
} from './ports';

@Injectable()
export class NestArchitectureGovernanceCatalogAdapter implements ArchitectureGovernanceCatalogPort {
  constructor(private readonly service: ArchitectureGovernanceService) {}

  engine(): ArchitectureGovernanceEngineBundle {
    return this.service.engine();
  }

  listProducts(): ArchitectureGovernanceProductRow[] {
    const bundle = this.engine() as {
      products?: ArchitectureGovernanceProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/architecture-governance`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'architecture-governance',
        name: 'Architecture Governance',
        status: 'shipped',
        api: 'GET /v1/architecture-governance/engine',
        console: '/architecture-governance',
        notes: 'VL-346 shipped.',
      },
    ];
  }
}

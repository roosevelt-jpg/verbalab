import { Injectable } from '@nestjs/common';
import { GlobalPolicyEngineService } from '../global-policy-engine.service';
import {
  GlobalPolicyEngineCatalogPort,
  GlobalPolicyEngineEngineBundle,
  GlobalPolicyEngineProductRow,
} from './ports';

@Injectable()
export class NestGlobalPolicyEngineCatalogAdapter implements GlobalPolicyEngineCatalogPort {
  constructor(private readonly service: GlobalPolicyEngineService) {}

  engine(): GlobalPolicyEngineEngineBundle {
    return this.service.engine();
  }

  listProducts(): GlobalPolicyEngineProductRow[] {
    const bundle = this.engine() as {
      products?: GlobalPolicyEngineProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/global-policy-engine`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'global-policy-engine',
        name: 'Global Policy Engine',
        status: 'shipped',
        api: 'GET /v1/global-policy-engine/engine',
        console: '/global-policy-engine',
        notes: ' shipped.',
      },
    ];
  }
}

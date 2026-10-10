import { Injectable } from '@nestjs/common';
import { SupplyChainSecurityService } from '../supply-chain-security.service';
import {
  SupplyChainSecurityCatalogPort,
  SupplyChainSecurityEngineBundle,
  SupplyChainSecurityProductRow,
} from './ports';

@Injectable()
export class NestSupplyChainSecurityCatalogAdapter implements SupplyChainSecurityCatalogPort {
  constructor(private readonly service: SupplyChainSecurityService) {}

  engine(): SupplyChainSecurityEngineBundle {
    return this.service.engine();
  }

  listProducts(): SupplyChainSecurityProductRow[] {
    const bundle = this.engine() as {
      products?: SupplyChainSecurityProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/supply-chain-security`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'supply-chain-security',
        name: 'Supply Chain Security',
        status: 'shipped',
        api: 'GET /v1/supply-chain-security/engine',
        console: '/supply-chain-security',
        notes: ' shipped.',
      },
    ];
  }
}

import { Injectable } from '@nestjs/common';
import { IdentityFederationService } from '../identity-federation.service';
import {
  IdentityFederationCatalogPort,
  IdentityFederationEngineBundle,
  IdentityFederationProductRow,
} from './ports';

@Injectable()
export class NestIdentityFederationCatalogAdapter implements IdentityFederationCatalogPort {
  constructor(private readonly service: IdentityFederationService) {}

  engine(): IdentityFederationEngineBundle {
    return this.service.engine();
  }

  listProducts(): IdentityFederationProductRow[] {
    const bundle = this.engine() as {
      products?: IdentityFederationProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/identity-federation`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'identity-federation',
        name: 'Identity Federation',
        status: 'shipped',
        api: 'GET /v1/identity-federation/engine',
        console: '/identity-federation',
        notes: 'VL-299 shipped.',
      },
    ];
  }
}

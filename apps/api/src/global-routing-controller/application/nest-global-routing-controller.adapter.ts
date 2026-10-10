import { Injectable } from '@nestjs/common';
import { GlobalRoutingControllerService } from '../global-routing-controller.service';
import {
  GlobalRoutingControllerCatalogPort,
  GlobalRoutingControllerEngineBundle,
  GlobalRoutingControllerProductRow,
} from './ports';

@Injectable()
export class NestGlobalRoutingControllerCatalogAdapter implements GlobalRoutingControllerCatalogPort {
  constructor(private readonly service: GlobalRoutingControllerService) {}

  engine(): GlobalRoutingControllerEngineBundle {
    return this.service.engine();
  }

  listProducts(): GlobalRoutingControllerProductRow[] {
    const bundle = this.engine() as {
      products?: GlobalRoutingControllerProductRow[];
      capabilities?: Array<{ id: string; name: string; status: string; api?: string | null; notes?: string }>;
    };
    if (Array.isArray(bundle.products)) return bundle.products;
    if (Array.isArray(bundle.capabilities)) {
      return bundle.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api ?? null,
        console: `/global-routing-controller`,
        notes: c.notes ?? '',
      }));
    }
    return [
      {
        id: 'global-routing-controller',
        name: 'Global Routing Controller',
        status: 'shipped',
        api: 'GET /v1/global-routing-controller/engine',
        console: '/global-routing-controller',
        notes: ' shipped.',
      },
    ];
  }
}

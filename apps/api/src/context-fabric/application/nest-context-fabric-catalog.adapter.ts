import { Injectable } from '@nestjs/common';
import { ContextFabricService } from '../context-fabric.service';
import {
  contextFabricCapabilityCatalog,
  contextFabricRoutingTable,
} from '../context-fabric.catalog';
import {
  ContextFabricCapabilityRow,
  ContextFabricCatalogPort,
  ContextFabricProductsBundle,
  ContextFabricRouteRow,
} from './ports';

@Injectable()
export class NestContextFabricCatalogAdapter implements ContextFabricCatalogPort {
  constructor(private readonly fabric: ContextFabricService) {}

  products(): ContextFabricProductsBundle {
    return this.fabric.products();
  }

  listCapabilities(): ContextFabricCapabilityRow[] {
    return contextFabricCapabilityCatalog();
  }

  listRoutes(): ContextFabricRouteRow[] {
    return contextFabricRoutingTable();
  }
}

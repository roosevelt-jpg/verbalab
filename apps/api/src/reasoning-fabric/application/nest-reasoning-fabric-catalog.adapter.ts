import { Injectable } from '@nestjs/common';
import { ReasoningFabricService } from '../reasoning-fabric.service';
import {
  reasoningFabricCapabilityCatalog,
  reasoningFabricRoutingTable,
} from '../reasoning-fabric.catalog';
import {
  ReasoningFabricCapabilityRow,
  ReasoningFabricCatalogPort,
  ReasoningFabricProductsBundle,
  ReasoningFabricRouteRow,
} from './ports';

@Injectable
export class NestReasoningFabricCatalogAdapter implements ReasoningFabricCatalogPort {
  constructor(private readonly fabric: ReasoningFabricService) {}

  products: ReasoningFabricProductsBundle {
    return this.fabric.products;
  }

  listCapabilities: ReasoningFabricCapabilityRow[] {
    return reasoningFabricCapabilityCatalog;
  }

  listRoutes: ReasoningFabricRouteRow[] {
    return reasoningFabricRoutingTable;
  }
}

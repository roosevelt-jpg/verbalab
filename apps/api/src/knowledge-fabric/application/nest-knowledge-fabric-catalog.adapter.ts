import { Injectable } from '@nestjs/common';
import { KnowledgeFabricService } from '../knowledge-fabric.service';
import {
  knowledgeFabricCapabilityCatalog,
  knowledgeFabricRoutingTable,
} from '../knowledge-fabric.catalog';
import {
  KnowledgeFabricCapabilityRow,
  KnowledgeFabricCatalogPort,
  KnowledgeFabricProductsBundle,
  KnowledgeFabricRouteRow,
} from './ports';

@Injectable
export class NestKnowledgeFabricCatalogAdapter implements KnowledgeFabricCatalogPort {
  constructor(private readonly fabric: KnowledgeFabricService) {}

  products: KnowledgeFabricProductsBundle {
    return this.fabric.products;
  }

  listCapabilities: KnowledgeFabricCapabilityRow[] {
    return knowledgeFabricCapabilityCatalog;
  }

  listRoutes: KnowledgeFabricRouteRow[] {
    return knowledgeFabricRoutingTable;
  }
}

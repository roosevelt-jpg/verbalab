import { Injectable } from '@nestjs/common';
import { MemoryFabricService } from '../memory-fabric.service';
import {
  memoryFabricCapabilityCatalog,
  memoryFabricRoutingTable,
} from '../memory-fabric.catalog';
import {
  MemoryFabricCapabilityRow,
  MemoryFabricCatalogPort,
  MemoryFabricProductsBundle,
  MemoryFabricRouteRow,
} from './ports';

@Injectable
export class NestMemoryFabricCatalogAdapter implements MemoryFabricCatalogPort {
  constructor(private readonly fabric: MemoryFabricService) {}

  products: MemoryFabricProductsBundle {
    return this.fabric.products;
  }

  listCapabilities: MemoryFabricCapabilityRow[] {
    return memoryFabricCapabilityCatalog;
  }

  listRoutes: MemoryFabricRouteRow[] {
    return memoryFabricRoutingTable;
  }
}

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetMemoryFabricProductsBundleQuery,
  ListMemoryFabricCapabilitiesQuery,
  ListMemoryFabricRoutesQuery,
} from './messages';
import {
  MEMORY_FABRIC_CATALOG_PORT,
  MemoryFabricCapabilityRow,
  MemoryFabricCatalogPort,
  MemoryFabricProductsBundle,
  MemoryFabricRouteRow,
} from './ports';

@QueryHandler(ListMemoryFabricCapabilitiesQuery)
export class ListMemoryFabricCapabilitiesHandler
  implements IQueryHandler<ListMemoryFabricCapabilitiesQuery>
{
  constructor(
    @Inject(MEMORY_FABRIC_CATALOG_PORT)
    private readonly catalog: MemoryFabricCatalogPort,
  ) {}

  execute(): Promise<MemoryFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities());
  }
}

@QueryHandler(ListMemoryFabricRoutesQuery)
export class ListMemoryFabricRoutesHandler
  implements IQueryHandler<ListMemoryFabricRoutesQuery>
{
  constructor(
    @Inject(MEMORY_FABRIC_CATALOG_PORT)
    private readonly catalog: MemoryFabricCatalogPort,
  ) {}

  execute(): Promise<MemoryFabricRouteRow[]> {
    return Promise.resolve(this.catalog.listRoutes());
  }
}

@QueryHandler(GetMemoryFabricProductsBundleQuery)
export class GetMemoryFabricProductsBundleHandler
  implements IQueryHandler<GetMemoryFabricProductsBundleQuery>
{
  constructor(
    @Inject(MEMORY_FABRIC_CATALOG_PORT)
    private readonly catalog: MemoryFabricCatalogPort,
  ) {}

  execute(): Promise<MemoryFabricProductsBundle> {
    return Promise.resolve(this.catalog.products());
  }
}

export const MEMORY_FABRIC_HANDLERS = [
  ListMemoryFabricCapabilitiesHandler,
  ListMemoryFabricRoutesHandler,
  GetMemoryFabricProductsBundleHandler,
];

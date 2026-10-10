import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetContextFabricProductsBundleQuery,
  ListContextFabricCapabilitiesQuery,
  ListContextFabricRoutesQuery,
} from './messages';
import {
  CONTEXT_FABRIC_CATALOG_PORT,
  ContextFabricCapabilityRow,
  ContextFabricCatalogPort,
  ContextFabricProductsBundle,
  ContextFabricRouteRow,
} from './ports';

@QueryHandler(ListContextFabricCapabilitiesQuery)
export class ListContextFabricCapabilitiesHandler
  implements IQueryHandler<ListContextFabricCapabilitiesQuery>
{
  constructor(
    @Inject(CONTEXT_FABRIC_CATALOG_PORT) private readonly catalog: ContextFabricCatalogPort,
  ) {}

  execute(): Promise<ContextFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities());
  }
}

@QueryHandler(ListContextFabricRoutesQuery)
export class ListContextFabricRoutesHandler
  implements IQueryHandler<ListContextFabricRoutesQuery>
{
  constructor(
    @Inject(CONTEXT_FABRIC_CATALOG_PORT) private readonly catalog: ContextFabricCatalogPort,
  ) {}

  execute(): Promise<ContextFabricRouteRow[]> {
    return Promise.resolve(this.catalog.listRoutes());
  }
}

@QueryHandler(GetContextFabricProductsBundleQuery)
export class GetContextFabricProductsBundleHandler
  implements IQueryHandler<GetContextFabricProductsBundleQuery>
{
  constructor(
    @Inject(CONTEXT_FABRIC_CATALOG_PORT) private readonly catalog: ContextFabricCatalogPort,
  ) {}

  execute(): Promise<ContextFabricProductsBundle> {
    return Promise.resolve(this.catalog.products());
  }
}

export const CONTEXT_FABRIC_HANDLERS = [
  ListContextFabricCapabilitiesHandler,
  ListContextFabricRoutesHandler,
  GetContextFabricProductsBundleHandler,
];

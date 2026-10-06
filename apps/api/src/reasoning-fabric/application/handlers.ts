import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetReasoningFabricProductsBundleQuery,
  ListReasoningFabricCapabilitiesQuery,
  ListReasoningFabricRoutesQuery,
} from './messages';
import {
  REASONING_FABRIC_CATALOG_PORT,
  ReasoningFabricCapabilityRow,
  ReasoningFabricCatalogPort,
  ReasoningFabricProductsBundle,
  ReasoningFabricRouteRow,
} from './ports';

@QueryHandler(ListReasoningFabricCapabilitiesQuery)
export class ListReasoningFabricCapabilitiesHandler
  implements IQueryHandler<ListReasoningFabricCapabilitiesQuery>
{
  constructor(
    @Inject(REASONING_FABRIC_CATALOG_PORT)
    private readonly catalog: ReasoningFabricCatalogPort,
  ) {}

  execute: Promise<ReasoningFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities);
  }
}

@QueryHandler(ListReasoningFabricRoutesQuery)
export class ListReasoningFabricRoutesHandler
  implements IQueryHandler<ListReasoningFabricRoutesQuery>
{
  constructor(
    @Inject(REASONING_FABRIC_CATALOG_PORT)
    private readonly catalog: ReasoningFabricCatalogPort,
  ) {}

  execute: Promise<ReasoningFabricRouteRow[]> {
    return Promise.resolve(this.catalog.listRoutes);
  }
}

@QueryHandler(GetReasoningFabricProductsBundleQuery)
export class GetReasoningFabricProductsBundleHandler
  implements IQueryHandler<GetReasoningFabricProductsBundleQuery>
{
  constructor(
    @Inject(REASONING_FABRIC_CATALOG_PORT)
    private readonly catalog: ReasoningFabricCatalogPort,
  ) {}

  execute: Promise<ReasoningFabricProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const REASONING_FABRIC_HANDLERS = [
  ListReasoningFabricCapabilitiesHandler,
  ListReasoningFabricRoutesHandler,
  GetReasoningFabricProductsBundleHandler,
];

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetPromptFabricProductsBundleQuery,
  ListPromptFabricCapabilitiesQuery,
  ListPromptFabricRoutesQuery,
} from './messages';
import {
  PROMPT_FABRIC_CATALOG_PORT,
  PromptFabricCapabilityRow,
  PromptFabricCatalogPort,
  PromptFabricProductsBundle,
  PromptFabricRouteRow,
} from './ports';

@QueryHandler(ListPromptFabricCapabilitiesQuery)
export class ListPromptFabricCapabilitiesHandler
  implements IQueryHandler<ListPromptFabricCapabilitiesQuery>
{
  constructor(
    @Inject(PROMPT_FABRIC_CATALOG_PORT) private readonly catalog: PromptFabricCatalogPort,
  ) {}

  execute: Promise<PromptFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities);
  }
}

@QueryHandler(ListPromptFabricRoutesQuery)
export class ListPromptFabricRoutesHandler
  implements IQueryHandler<ListPromptFabricRoutesQuery>
{
  constructor(
    @Inject(PROMPT_FABRIC_CATALOG_PORT) private readonly catalog: PromptFabricCatalogPort,
  ) {}

  execute: Promise<PromptFabricRouteRow[]> {
    return Promise.resolve(this.catalog.listRoutes);
  }
}

@QueryHandler(GetPromptFabricProductsBundleQuery)
export class GetPromptFabricProductsBundleHandler
  implements IQueryHandler<GetPromptFabricProductsBundleQuery>
{
  constructor(
    @Inject(PROMPT_FABRIC_CATALOG_PORT) private readonly catalog: PromptFabricCatalogPort,
  ) {}

  execute: Promise<PromptFabricProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const PROMPT_FABRIC_HANDLERS = [
  ListPromptFabricCapabilitiesHandler,
  ListPromptFabricRoutesHandler,
  GetPromptFabricProductsBundleHandler,
];

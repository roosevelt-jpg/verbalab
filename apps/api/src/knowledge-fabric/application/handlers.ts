import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetKnowledgeFabricProductsBundleQuery,
  ListKnowledgeFabricCapabilitiesQuery,
  ListKnowledgeFabricRoutesQuery,
} from './messages';
import {
  KNOWLEDGE_FABRIC_CATALOG_PORT,
  KnowledgeFabricCapabilityRow,
  KnowledgeFabricCatalogPort,
  KnowledgeFabricProductsBundle,
  KnowledgeFabricRouteRow,
} from './ports';

@QueryHandler(ListKnowledgeFabricCapabilitiesQuery)
export class ListKnowledgeFabricCapabilitiesHandler
  implements IQueryHandler<ListKnowledgeFabricCapabilitiesQuery>
{
  constructor(
    @Inject(KNOWLEDGE_FABRIC_CATALOG_PORT)
    private readonly catalog: KnowledgeFabricCatalogPort,
  ) {}

  execute: Promise<KnowledgeFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities);
  }
}

@QueryHandler(ListKnowledgeFabricRoutesQuery)
export class ListKnowledgeFabricRoutesHandler
  implements IQueryHandler<ListKnowledgeFabricRoutesQuery>
{
  constructor(
    @Inject(KNOWLEDGE_FABRIC_CATALOG_PORT)
    private readonly catalog: KnowledgeFabricCatalogPort,
  ) {}

  execute: Promise<KnowledgeFabricRouteRow[]> {
    return Promise.resolve(this.catalog.listRoutes);
  }
}

@QueryHandler(GetKnowledgeFabricProductsBundleQuery)
export class GetKnowledgeFabricProductsBundleHandler
  implements IQueryHandler<GetKnowledgeFabricProductsBundleQuery>
{
  constructor(
    @Inject(KNOWLEDGE_FABRIC_CATALOG_PORT)
    private readonly catalog: KnowledgeFabricCatalogPort,
  ) {}

  execute: Promise<KnowledgeFabricProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const KNOWLEDGE_FABRIC_HANDLERS = [
  ListKnowledgeFabricCapabilitiesHandler,
  ListKnowledgeFabricRoutesHandler,
  GetKnowledgeFabricProductsBundleHandler,
];

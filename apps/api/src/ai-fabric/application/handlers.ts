import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetAiFabricProductsBundleQuery,
  ListAiFabricBusesQuery,
} from './messages';
import {
  AI_FABRIC_CATALOG_PORT,
  AiFabricCatalogPort,
  FabricBusRow,
  FabricProductsBundle,
} from './ports';

@QueryHandler(ListAiFabricBusesQuery)
export class ListAiFabricBusesHandler implements IQueryHandler<ListAiFabricBusesQuery> {
  constructor(
    @Inject(AI_FABRIC_CATALOG_PORT) private readonly catalog: AiFabricCatalogPort,
  ) {}

  execute(): Promise<FabricBusRow[]> {
    return Promise.resolve(this.catalog.listBuses());
  }
}

@QueryHandler(GetAiFabricProductsBundleQuery)
export class GetAiFabricProductsBundleHandler
  implements IQueryHandler<GetAiFabricProductsBundleQuery>
{
  constructor(
    @Inject(AI_FABRIC_CATALOG_PORT) private readonly catalog: AiFabricCatalogPort,
  ) {}

  execute(): Promise<FabricProductsBundle> {
    return Promise.resolve(this.catalog.products());
  }
}

export const AI_FABRIC_HANDLERS = [
  ListAiFabricBusesHandler,
  GetAiFabricProductsBundleHandler,
];

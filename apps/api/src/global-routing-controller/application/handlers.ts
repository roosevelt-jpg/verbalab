import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGlobalRoutingControllerEngineQuery, ListGlobalRoutingControllerProductsQuery } from './messages';
import {
  GLOBAL_ROUTING_CONTROLLER_CATALOG_PORT,
  GlobalRoutingControllerCatalogPort,
  GlobalRoutingControllerEngineBundle,
  GlobalRoutingControllerProductRow,
} from './ports';

@QueryHandler(GetGlobalRoutingControllerEngineQuery)
export class GetGlobalRoutingControllerEngineHandler
  implements IQueryHandler<GetGlobalRoutingControllerEngineQuery>
{
  constructor(
    @Inject(GLOBAL_ROUTING_CONTROLLER_CATALOG_PORT)
    private readonly catalog: GlobalRoutingControllerCatalogPort,
  ) {}

  execute: Promise<GlobalRoutingControllerEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListGlobalRoutingControllerProductsQuery)
export class ListGlobalRoutingControllerProductsHandler
  implements IQueryHandler<ListGlobalRoutingControllerProductsQuery>
{
  constructor(
    @Inject(GLOBAL_ROUTING_CONTROLLER_CATALOG_PORT)
    private readonly catalog: GlobalRoutingControllerCatalogPort,
  ) {}

  execute: Promise<GlobalRoutingControllerProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const GLOBAL_ROUTING_CONTROLLER_HANDLERS = [GetGlobalRoutingControllerEngineHandler, ListGlobalRoutingControllerProductsHandler];

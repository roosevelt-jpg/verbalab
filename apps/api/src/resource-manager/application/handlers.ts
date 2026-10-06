import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetResourceManagerEngineQuery, ListResourceManagerProductsQuery } from './messages';
import {
  RESOURCE_MANAGER_CATALOG_PORT,
  ResourceManagerCatalogPort,
  ResourceManagerEngineBundle,
  ResourceManagerProductRow,
} from './ports';

@QueryHandler(GetResourceManagerEngineQuery)
export class GetResourceManagerEngineHandler
  implements IQueryHandler<GetResourceManagerEngineQuery>
{
  constructor(
    @Inject(RESOURCE_MANAGER_CATALOG_PORT)
    private readonly catalog: ResourceManagerCatalogPort,
  ) {}

  execute(): Promise<ResourceManagerEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListResourceManagerProductsQuery)
export class ListResourceManagerProductsHandler
  implements IQueryHandler<ListResourceManagerProductsQuery>
{
  constructor(
    @Inject(RESOURCE_MANAGER_CATALOG_PORT)
    private readonly catalog: ResourceManagerCatalogPort,
  ) {}

  execute(): Promise<ResourceManagerProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const RESOURCE_MANAGER_HANDLERS = [GetResourceManagerEngineHandler, ListResourceManagerProductsHandler];

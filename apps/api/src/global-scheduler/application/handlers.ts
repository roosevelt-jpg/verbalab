import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGlobalSchedulerEngineQuery, ListGlobalSchedulerProductsQuery } from './messages';
import {
  GLOBAL_SCHEDULER_CATALOG_PORT,
  GlobalSchedulerCatalogPort,
  GlobalSchedulerEngineBundle,
  GlobalSchedulerProductRow,
} from './ports';

@QueryHandler(GetGlobalSchedulerEngineQuery)
export class GetGlobalSchedulerEngineHandler
  implements IQueryHandler<GetGlobalSchedulerEngineQuery>
{
  constructor(
    @Inject(GLOBAL_SCHEDULER_CATALOG_PORT)
    private readonly catalog: GlobalSchedulerCatalogPort,
  ) {}

  execute: Promise<GlobalSchedulerEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListGlobalSchedulerProductsQuery)
export class ListGlobalSchedulerProductsHandler
  implements IQueryHandler<ListGlobalSchedulerProductsQuery>
{
  constructor(
    @Inject(GLOBAL_SCHEDULER_CATALOG_PORT)
    private readonly catalog: GlobalSchedulerCatalogPort,
  ) {}

  execute: Promise<GlobalSchedulerProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const GLOBAL_SCHEDULER_HANDLERS = [GetGlobalSchedulerEngineHandler, ListGlobalSchedulerProductsHandler];

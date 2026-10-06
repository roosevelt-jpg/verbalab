import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiOperationsDashboardEngineQuery, ListAiOperationsDashboardProductsQuery } from './messages';
import {
  AI_OPERATIONS_DASHBOARD_CATALOG_PORT,
  AiOperationsDashboardCatalogPort,
  AiOperationsDashboardEngineBundle,
  AiOperationsDashboardProductRow,
} from './ports';

@QueryHandler(GetAiOperationsDashboardEngineQuery)
export class GetAiOperationsDashboardEngineHandler
  implements IQueryHandler<GetAiOperationsDashboardEngineQuery>
{
  constructor(
    @Inject(AI_OPERATIONS_DASHBOARD_CATALOG_PORT)
    private readonly catalog: AiOperationsDashboardCatalogPort,
  ) {}

  execute: Promise<AiOperationsDashboardEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAiOperationsDashboardProductsQuery)
export class ListAiOperationsDashboardProductsHandler
  implements IQueryHandler<ListAiOperationsDashboardProductsQuery>
{
  constructor(
    @Inject(AI_OPERATIONS_DASHBOARD_CATALOG_PORT)
    private readonly catalog: AiOperationsDashboardCatalogPort,
  ) {}

  execute: Promise<AiOperationsDashboardProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AI_OPERATIONS_DASHBOARD_HANDLERS = [GetAiOperationsDashboardEngineHandler, ListAiOperationsDashboardProductsHandler];

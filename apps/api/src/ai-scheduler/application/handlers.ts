import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiSchedulerEngineQuery, ListAiSchedulerProductsQuery } from './messages';
import {
  AI_SCHEDULER_CATALOG_PORT,
  AiSchedulerCatalogPort,
  AiSchedulerEngineBundle,
  AiSchedulerProductRow,
} from './ports';

@QueryHandler(GetAiSchedulerEngineQuery)
export class GetAiSchedulerEngineHandler
  implements IQueryHandler<GetAiSchedulerEngineQuery>
{
  constructor(
    @Inject(AI_SCHEDULER_CATALOG_PORT)
    private readonly catalog: AiSchedulerCatalogPort,
  ) {}

  execute(): Promise<AiSchedulerEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListAiSchedulerProductsQuery)
export class ListAiSchedulerProductsHandler
  implements IQueryHandler<ListAiSchedulerProductsQuery>
{
  constructor(
    @Inject(AI_SCHEDULER_CATALOG_PORT)
    private readonly catalog: AiSchedulerCatalogPort,
  ) {}

  execute(): Promise<AiSchedulerProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const AI_SCHEDULER_HANDLERS = [GetAiSchedulerEngineHandler, ListAiSchedulerProductsHandler];

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEvaluationPlatformEngineQuery, ListEvaluationPlatformProductsQuery } from './messages';
import {
  EVALUATION_PLATFORM_CATALOG_PORT,
  EvaluationPlatformCatalogPort,
  EvaluationPlatformEngineBundle,
  EvaluationPlatformProductRow,
} from './ports';

@QueryHandler(GetEvaluationPlatformEngineQuery)
export class GetEvaluationPlatformEngineHandler
  implements IQueryHandler<GetEvaluationPlatformEngineQuery>
{
  constructor(
    @Inject(EVALUATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: EvaluationPlatformCatalogPort,
  ) {}

  execute(): Promise<EvaluationPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListEvaluationPlatformProductsQuery)
export class ListEvaluationPlatformProductsHandler
  implements IQueryHandler<ListEvaluationPlatformProductsQuery>
{
  constructor(
    @Inject(EVALUATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: EvaluationPlatformCatalogPort,
  ) {}

  execute(): Promise<EvaluationPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const EVALUATION_PLATFORM_HANDLERS = [GetEvaluationPlatformEngineHandler, ListEvaluationPlatformProductsHandler];

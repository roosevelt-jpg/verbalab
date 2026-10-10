import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetContinuousEvaluationEngineQuery, ListContinuousEvaluationProductsQuery } from './messages';
import {
  CONTINUOUS_EVALUATION_CATALOG_PORT,
  ContinuousEvaluationCatalogPort,
  ContinuousEvaluationEngineBundle,
  ContinuousEvaluationProductRow,
} from './ports';

@QueryHandler(GetContinuousEvaluationEngineQuery)
export class GetContinuousEvaluationEngineHandler
  implements IQueryHandler<GetContinuousEvaluationEngineQuery>
{
  constructor(
    @Inject(CONTINUOUS_EVALUATION_CATALOG_PORT)
    private readonly catalog: ContinuousEvaluationCatalogPort,
  ) {}

  execute(): Promise<ContinuousEvaluationEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListContinuousEvaluationProductsQuery)
export class ListContinuousEvaluationProductsHandler
  implements IQueryHandler<ListContinuousEvaluationProductsQuery>
{
  constructor(
    @Inject(CONTINUOUS_EVALUATION_CATALOG_PORT)
    private readonly catalog: ContinuousEvaluationCatalogPort,
  ) {}

  execute(): Promise<ContinuousEvaluationProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const CONTINUOUS_EVALUATION_HANDLERS = [GetContinuousEvaluationEngineHandler, ListContinuousEvaluationProductsHandler];

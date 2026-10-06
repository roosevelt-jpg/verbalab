import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetContinuousLearningEngineQuery, ListContinuousLearningProductsQuery } from './messages';
import {
  CONTINUOUS_LEARNING_CATALOG_PORT,
  ContinuousLearningCatalogPort,
  ContinuousLearningEngineBundle,
  ContinuousLearningProductRow,
} from './ports';

@QueryHandler(GetContinuousLearningEngineQuery)
export class GetContinuousLearningEngineHandler
  implements IQueryHandler<GetContinuousLearningEngineQuery>
{
  constructor(
    @Inject(CONTINUOUS_LEARNING_CATALOG_PORT)
    private readonly catalog: ContinuousLearningCatalogPort,
  ) {}

  execute(): Promise<ContinuousLearningEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListContinuousLearningProductsQuery)
export class ListContinuousLearningProductsHandler
  implements IQueryHandler<ListContinuousLearningProductsQuery>
{
  constructor(
    @Inject(CONTINUOUS_LEARNING_CATALOG_PORT)
    private readonly catalog: ContinuousLearningCatalogPort,
  ) {}

  execute(): Promise<ContinuousLearningProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const CONTINUOUS_LEARNING_HANDLERS = [GetContinuousLearningEngineHandler, ListContinuousLearningProductsHandler];

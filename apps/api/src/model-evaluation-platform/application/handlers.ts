import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetModelEvaluationPlatformEngineQuery,
  ListModelEvaluationSuitesQuery,
} from './messages';
import {
  MODEL_EVALUATION_PLATFORM_CATALOG_PORT,
  ModelEvaluationPlatformCatalogPort,
  MepEngineBundle,
  MepSuiteRow,
} from './ports';

@QueryHandler(ListModelEvaluationSuitesQuery)
export class ListModelEvaluationSuitesHandler
  implements IQueryHandler<ListModelEvaluationSuitesQuery>
{
  constructor(
    @Inject(MODEL_EVALUATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: ModelEvaluationPlatformCatalogPort,
  ) {}

  execute(): Promise<MepSuiteRow[]> {
    return Promise.resolve(this.catalog.listSuites());
  }
}

@QueryHandler(GetModelEvaluationPlatformEngineQuery)
export class GetModelEvaluationPlatformEngineHandler
  implements IQueryHandler<GetModelEvaluationPlatformEngineQuery>
{
  constructor(
    @Inject(MODEL_EVALUATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: ModelEvaluationPlatformCatalogPort,
  ) {}

  execute(): Promise<MepEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

export const MODEL_EVALUATION_PLATFORM_HANDLERS = [
  ListModelEvaluationSuitesHandler,
  GetModelEvaluationPlatformEngineHandler,
];

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiDriftDetectionEngineQuery, ListAiDriftDetectionProductsQuery } from './messages';
import {
  AI_DRIFT_DETECTION_CATALOG_PORT,
  AiDriftDetectionCatalogPort,
  AiDriftDetectionEngineBundle,
  AiDriftDetectionProductRow,
} from './ports';

@QueryHandler(GetAiDriftDetectionEngineQuery)
export class GetAiDriftDetectionEngineHandler
  implements IQueryHandler<GetAiDriftDetectionEngineQuery>
{
  constructor(
    @Inject(AI_DRIFT_DETECTION_CATALOG_PORT)
    private readonly catalog: AiDriftDetectionCatalogPort,
  ) {}

  execute(): Promise<AiDriftDetectionEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListAiDriftDetectionProductsQuery)
export class ListAiDriftDetectionProductsHandler
  implements IQueryHandler<ListAiDriftDetectionProductsQuery>
{
  constructor(
    @Inject(AI_DRIFT_DETECTION_CATALOG_PORT)
    private readonly catalog: AiDriftDetectionCatalogPort,
  ) {}

  execute(): Promise<AiDriftDetectionProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const AI_DRIFT_DETECTION_HANDLERS = [GetAiDriftDetectionEngineHandler, ListAiDriftDetectionProductsHandler];

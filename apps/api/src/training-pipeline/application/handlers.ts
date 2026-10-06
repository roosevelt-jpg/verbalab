import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTrainingPipelineEngineQuery, ListTrainingPipelineProductsQuery } from './messages';
import {
  TRAINING_PIPELINE_CATALOG_PORT,
  TrainingPipelineCatalogPort,
  TrainingPipelineEngineBundle,
  TrainingPipelineProductRow,
} from './ports';

@QueryHandler(GetTrainingPipelineEngineQuery)
export class GetTrainingPipelineEngineHandler
  implements IQueryHandler<GetTrainingPipelineEngineQuery>
{
  constructor(
    @Inject(TRAINING_PIPELINE_CATALOG_PORT)
    private readonly catalog: TrainingPipelineCatalogPort,
  ) {}

  execute: Promise<TrainingPipelineEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListTrainingPipelineProductsQuery)
export class ListTrainingPipelineProductsHandler
  implements IQueryHandler<ListTrainingPipelineProductsQuery>
{
  constructor(
    @Inject(TRAINING_PIPELINE_CATALOG_PORT)
    private readonly catalog: TrainingPipelineCatalogPort,
  ) {}

  execute: Promise<TrainingPipelineProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const TRAINING_PIPELINE_HANDLERS = [GetTrainingPipelineEngineHandler, ListTrainingPipelineProductsHandler];

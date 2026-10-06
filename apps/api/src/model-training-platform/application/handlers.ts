import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetModelTrainingPlatformEngineQuery,
  ListModelTrainingMethodsQuery,
} from './messages';
import {
  MODEL_TRAINING_PLATFORM_CATALOG_PORT,
  ModelTrainingPlatformCatalogPort,
  MtpEngineBundle,
  MtpMethodRow,
} from './ports';

@QueryHandler(ListModelTrainingMethodsQuery)
export class ListModelTrainingMethodsHandler
  implements IQueryHandler<ListModelTrainingMethodsQuery>
{
  constructor(
    @Inject(MODEL_TRAINING_PLATFORM_CATALOG_PORT)
    private readonly catalog: ModelTrainingPlatformCatalogPort,
  ) {}

  execute(): Promise<MtpMethodRow[]> {
    return Promise.resolve(this.catalog.listMethods());
  }
}

@QueryHandler(GetModelTrainingPlatformEngineQuery)
export class GetModelTrainingPlatformEngineHandler
  implements IQueryHandler<GetModelTrainingPlatformEngineQuery>
{
  constructor(
    @Inject(MODEL_TRAINING_PLATFORM_CATALOG_PORT)
    private readonly catalog: ModelTrainingPlatformCatalogPort,
  ) {}

  execute(): Promise<MtpEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

export const MODEL_TRAINING_PLATFORM_HANDLERS = [
  ListModelTrainingMethodsHandler,
  GetModelTrainingPlatformEngineHandler,
];

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetExperimentPlatformEngineQuery, ListExperimentPlatformProductsQuery } from './messages';
import {
  EXPERIMENT_PLATFORM_CATALOG_PORT,
  ExperimentPlatformCatalogPort,
  ExperimentPlatformEngineBundle,
  ExperimentPlatformProductRow,
} from './ports';

@QueryHandler(GetExperimentPlatformEngineQuery)
export class GetExperimentPlatformEngineHandler
  implements IQueryHandler<GetExperimentPlatformEngineQuery>
{
  constructor(
    @Inject(EXPERIMENT_PLATFORM_CATALOG_PORT)
    private readonly catalog: ExperimentPlatformCatalogPort,
  ) {}

  execute: Promise<ExperimentPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListExperimentPlatformProductsQuery)
export class ListExperimentPlatformProductsHandler
  implements IQueryHandler<ListExperimentPlatformProductsQuery>
{
  constructor(
    @Inject(EXPERIMENT_PLATFORM_CATALOG_PORT)
    private readonly catalog: ExperimentPlatformCatalogPort,
  ) {}

  execute: Promise<ExperimentPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const EXPERIMENT_PLATFORM_HANDLERS = [GetExperimentPlatformEngineHandler, ListExperimentPlatformProductsHandler];

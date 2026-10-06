import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDatasetPipelineEngineQuery, ListDatasetPipelineProductsQuery } from './messages';
import {
  DATASET_PIPELINE_CATALOG_PORT,
  DatasetPipelineCatalogPort,
  DatasetPipelineEngineBundle,
  DatasetPipelineProductRow,
} from './ports';

@QueryHandler(GetDatasetPipelineEngineQuery)
export class GetDatasetPipelineEngineHandler
  implements IQueryHandler<GetDatasetPipelineEngineQuery>
{
  constructor(
    @Inject(DATASET_PIPELINE_CATALOG_PORT)
    private readonly catalog: DatasetPipelineCatalogPort,
  ) {}

  execute(): Promise<DatasetPipelineEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListDatasetPipelineProductsQuery)
export class ListDatasetPipelineProductsHandler
  implements IQueryHandler<ListDatasetPipelineProductsQuery>
{
  constructor(
    @Inject(DATASET_PIPELINE_CATALOG_PORT)
    private readonly catalog: DatasetPipelineCatalogPort,
  ) {}

  execute(): Promise<DatasetPipelineProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const DATASET_PIPELINE_HANDLERS = [GetDatasetPipelineEngineHandler, ListDatasetPipelineProductsHandler];

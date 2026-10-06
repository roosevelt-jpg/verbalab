import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMlopsLlmopsCloudEngineQuery, ListMlopsLlmopsCloudProductsQuery } from './messages';
import {
  MLOPS_LLMOPS_CLOUD_CATALOG_PORT,
  MlopsLlmopsCloudCatalogPort,
  MlopsLlmopsCloudEngineBundle,
  MlopsLlmopsCloudProductRow,
} from './ports';

@QueryHandler(GetMlopsLlmopsCloudEngineQuery)
export class GetMlopsLlmopsCloudEngineHandler
  implements IQueryHandler<GetMlopsLlmopsCloudEngineQuery>
{
  constructor(
    @Inject(MLOPS_LLMOPS_CLOUD_CATALOG_PORT)
    private readonly catalog: MlopsLlmopsCloudCatalogPort,
  ) {}

  execute: Promise<MlopsLlmopsCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListMlopsLlmopsCloudProductsQuery)
export class ListMlopsLlmopsCloudProductsHandler
  implements IQueryHandler<ListMlopsLlmopsCloudProductsQuery>
{
  constructor(
    @Inject(MLOPS_LLMOPS_CLOUD_CATALOG_PORT)
    private readonly catalog: MlopsLlmopsCloudCatalogPort,
  ) {}

  execute: Promise<MlopsLlmopsCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const MLOPS_LLMOPS_CLOUD_HANDLERS = [GetMlopsLlmopsCloudEngineHandler, ListMlopsLlmopsCloudProductsHandler];

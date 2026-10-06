import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDataPlaneCloudEngineQuery, ListDataPlaneCloudProductsQuery } from './messages';
import {
  DATA_PLANE_CLOUD_CATALOG_PORT,
  DataPlaneCloudCatalogPort,
  DataPlaneCloudEngineBundle,
  DataPlaneCloudProductRow,
} from './ports';

@QueryHandler(GetDataPlaneCloudEngineQuery)
export class GetDataPlaneCloudEngineHandler
  implements IQueryHandler<GetDataPlaneCloudEngineQuery>
{
  constructor(
    @Inject(DATA_PLANE_CLOUD_CATALOG_PORT)
    private readonly catalog: DataPlaneCloudCatalogPort,
  ) {}

  execute: Promise<DataPlaneCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListDataPlaneCloudProductsQuery)
export class ListDataPlaneCloudProductsHandler
  implements IQueryHandler<ListDataPlaneCloudProductsQuery>
{
  constructor(
    @Inject(DATA_PLANE_CLOUD_CATALOG_PORT)
    private readonly catalog: DataPlaneCloudCatalogPort,
  ) {}

  execute: Promise<DataPlaneCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const DATA_PLANE_CLOUD_HANDLERS = [GetDataPlaneCloudEngineHandler, ListDataPlaneCloudProductsHandler];

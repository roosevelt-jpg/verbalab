import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDataPlaneStreamingEngineQuery, ListDataPlaneStreamingProductsQuery } from './messages';
import {
  DATA_PLANE_STREAMING_CATALOG_PORT,
  DataPlaneStreamingCatalogPort,
  DataPlaneStreamingEngineBundle,
  DataPlaneStreamingProductRow,
} from './ports';

@QueryHandler(GetDataPlaneStreamingEngineQuery)
export class GetDataPlaneStreamingEngineHandler
  implements IQueryHandler<GetDataPlaneStreamingEngineQuery>
{
  constructor(
    @Inject(DATA_PLANE_STREAMING_CATALOG_PORT)
    private readonly catalog: DataPlaneStreamingCatalogPort,
  ) {}

  execute(): Promise<DataPlaneStreamingEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListDataPlaneStreamingProductsQuery)
export class ListDataPlaneStreamingProductsHandler
  implements IQueryHandler<ListDataPlaneStreamingProductsQuery>
{
  constructor(
    @Inject(DATA_PLANE_STREAMING_CATALOG_PORT)
    private readonly catalog: DataPlaneStreamingCatalogPort,
  ) {}

  execute(): Promise<DataPlaneStreamingProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const DATA_PLANE_STREAMING_HANDLERS = [GetDataPlaneStreamingEngineHandler, ListDataPlaneStreamingProductsHandler];

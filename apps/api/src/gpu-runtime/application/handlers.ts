import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGpuRuntimeEngineQuery, ListGpuRuntimeProductsQuery } from './messages';
import {
  GPU_RUNTIME_CATALOG_PORT,
  GpuRuntimeCatalogPort,
  GpuRuntimeEngineBundle,
  GpuRuntimeProductRow,
} from './ports';

@QueryHandler(GetGpuRuntimeEngineQuery)
export class GetGpuRuntimeEngineHandler
  implements IQueryHandler<GetGpuRuntimeEngineQuery>
{
  constructor(
    @Inject(GPU_RUNTIME_CATALOG_PORT)
    private readonly catalog: GpuRuntimeCatalogPort,
  ) {}

  execute(): Promise<GpuRuntimeEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListGpuRuntimeProductsQuery)
export class ListGpuRuntimeProductsHandler
  implements IQueryHandler<ListGpuRuntimeProductsQuery>
{
  constructor(
    @Inject(GPU_RUNTIME_CATALOG_PORT)
    private readonly catalog: GpuRuntimeCatalogPort,
  ) {}

  execute(): Promise<GpuRuntimeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const GPU_RUNTIME_HANDLERS = [GetGpuRuntimeEngineHandler, ListGpuRuntimeProductsHandler];

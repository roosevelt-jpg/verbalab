import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetVisionRuntimeEngineQuery, ListVisionRuntimeProductsQuery } from './messages';
import {
  VISION_RUNTIME_CATALOG_PORT,
  VisionRuntimeCatalogPort,
  VisionRuntimeEngineBundle,
  VisionRuntimeProductRow,
} from './ports';

@QueryHandler(GetVisionRuntimeEngineQuery)
export class GetVisionRuntimeEngineHandler
  implements IQueryHandler<GetVisionRuntimeEngineQuery>
{
  constructor(
    @Inject(VISION_RUNTIME_CATALOG_PORT)
    private readonly catalog: VisionRuntimeCatalogPort,
  ) {}

  execute(): Promise<VisionRuntimeEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListVisionRuntimeProductsQuery)
export class ListVisionRuntimeProductsHandler
  implements IQueryHandler<ListVisionRuntimeProductsQuery>
{
  constructor(
    @Inject(VISION_RUNTIME_CATALOG_PORT)
    private readonly catalog: VisionRuntimeCatalogPort,
  ) {}

  execute(): Promise<VisionRuntimeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const VISION_RUNTIME_HANDLERS = [GetVisionRuntimeEngineHandler, ListVisionRuntimeProductsHandler];

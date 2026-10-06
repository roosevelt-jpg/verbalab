import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGoldenPathPlatformEngineQuery, ListGoldenPathPlatformProductsQuery } from './messages';
import {
  GOLDEN_PATH_PLATFORM_CATALOG_PORT,
  GoldenPathPlatformCatalogPort,
  GoldenPathPlatformEngineBundle,
  GoldenPathPlatformProductRow,
} from './ports';

@QueryHandler(GetGoldenPathPlatformEngineQuery)
export class GetGoldenPathPlatformEngineHandler
  implements IQueryHandler<GetGoldenPathPlatformEngineQuery>
{
  constructor(
    @Inject(GOLDEN_PATH_PLATFORM_CATALOG_PORT)
    private readonly catalog: GoldenPathPlatformCatalogPort,
  ) {}

  execute: Promise<GoldenPathPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListGoldenPathPlatformProductsQuery)
export class ListGoldenPathPlatformProductsHandler
  implements IQueryHandler<ListGoldenPathPlatformProductsQuery>
{
  constructor(
    @Inject(GOLDEN_PATH_PLATFORM_CATALOG_PORT)
    private readonly catalog: GoldenPathPlatformCatalogPort,
  ) {}

  execute: Promise<GoldenPathPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const GOLDEN_PATH_PLATFORM_HANDLERS = [GetGoldenPathPlatformEngineHandler, ListGoldenPathPlatformProductsHandler];

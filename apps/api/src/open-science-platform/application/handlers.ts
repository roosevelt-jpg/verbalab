import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOpenSciencePlatformEngineQuery, ListOpenSciencePlatformProductsQuery } from './messages';
import {
  OPEN_SCIENCE_PLATFORM_CATALOG_PORT,
  OpenSciencePlatformCatalogPort,
  OpenSciencePlatformEngineBundle,
  OpenSciencePlatformProductRow,
} from './ports';

@QueryHandler(GetOpenSciencePlatformEngineQuery)
export class GetOpenSciencePlatformEngineHandler
  implements IQueryHandler<GetOpenSciencePlatformEngineQuery>
{
  constructor(
    @Inject(OPEN_SCIENCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: OpenSciencePlatformCatalogPort,
  ) {}

  execute: Promise<OpenSciencePlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListOpenSciencePlatformProductsQuery)
export class ListOpenSciencePlatformProductsHandler
  implements IQueryHandler<ListOpenSciencePlatformProductsQuery>
{
  constructor(
    @Inject(OPEN_SCIENCE_PLATFORM_CATALOG_PORT)
    private readonly catalog: OpenSciencePlatformCatalogPort,
  ) {}

  execute: Promise<OpenSciencePlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const OPEN_SCIENCE_PLATFORM_HANDLERS = [GetOpenSciencePlatformEngineHandler, ListOpenSciencePlatformProductsHandler];

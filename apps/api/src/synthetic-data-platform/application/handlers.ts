import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSyntheticDataPlatformEngineQuery, ListSyntheticDataPlatformProductsQuery } from './messages';
import {
  SYNTHETIC_DATA_PLATFORM_CATALOG_PORT,
  SyntheticDataPlatformCatalogPort,
  SyntheticDataPlatformEngineBundle,
  SyntheticDataPlatformProductRow,
} from './ports';

@QueryHandler(GetSyntheticDataPlatformEngineQuery)
export class GetSyntheticDataPlatformEngineHandler
  implements IQueryHandler<GetSyntheticDataPlatformEngineQuery>
{
  constructor(
    @Inject(SYNTHETIC_DATA_PLATFORM_CATALOG_PORT)
    private readonly catalog: SyntheticDataPlatformCatalogPort,
  ) {}

  execute(): Promise<SyntheticDataPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListSyntheticDataPlatformProductsQuery)
export class ListSyntheticDataPlatformProductsHandler
  implements IQueryHandler<ListSyntheticDataPlatformProductsQuery>
{
  constructor(
    @Inject(SYNTHETIC_DATA_PLATFORM_CATALOG_PORT)
    private readonly catalog: SyntheticDataPlatformCatalogPort,
  ) {}

  execute(): Promise<SyntheticDataPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const SYNTHETIC_DATA_PLATFORM_HANDLERS = [GetSyntheticDataPlatformEngineHandler, ListSyntheticDataPlatformProductsHandler];

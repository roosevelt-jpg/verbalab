import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPrivacyPlatformEngineQuery, ListPrivacyPlatformProductsQuery } from './messages';
import {
  PRIVACY_PLATFORM_CATALOG_PORT,
  PrivacyPlatformCatalogPort,
  PrivacyPlatformEngineBundle,
  PrivacyPlatformProductRow,
} from './ports';

@QueryHandler(GetPrivacyPlatformEngineQuery)
export class GetPrivacyPlatformEngineHandler
  implements IQueryHandler<GetPrivacyPlatformEngineQuery>
{
  constructor(
    @Inject(PRIVACY_PLATFORM_CATALOG_PORT)
    private readonly catalog: PrivacyPlatformCatalogPort,
  ) {}

  execute: Promise<PrivacyPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListPrivacyPlatformProductsQuery)
export class ListPrivacyPlatformProductsHandler
  implements IQueryHandler<ListPrivacyPlatformProductsQuery>
{
  constructor(
    @Inject(PRIVACY_PLATFORM_CATALOG_PORT)
    private readonly catalog: PrivacyPlatformCatalogPort,
  ) {}

  execute: Promise<PrivacyPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const PRIVACY_PLATFORM_HANDLERS = [GetPrivacyPlatformEngineHandler, ListPrivacyPlatformProductsHandler];

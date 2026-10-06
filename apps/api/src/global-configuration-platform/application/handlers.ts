import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGlobalConfigurationPlatformEngineQuery, ListGlobalConfigurationPlatformProductsQuery } from './messages';
import {
  GLOBAL_CONFIGURATION_PLATFORM_CATALOG_PORT,
  GlobalConfigurationPlatformCatalogPort,
  GlobalConfigurationPlatformEngineBundle,
  GlobalConfigurationPlatformProductRow,
} from './ports';

@QueryHandler(GetGlobalConfigurationPlatformEngineQuery)
export class GetGlobalConfigurationPlatformEngineHandler
  implements IQueryHandler<GetGlobalConfigurationPlatformEngineQuery>
{
  constructor(
    @Inject(GLOBAL_CONFIGURATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: GlobalConfigurationPlatformCatalogPort,
  ) {}

  execute: Promise<GlobalConfigurationPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListGlobalConfigurationPlatformProductsQuery)
export class ListGlobalConfigurationPlatformProductsHandler
  implements IQueryHandler<ListGlobalConfigurationPlatformProductsQuery>
{
  constructor(
    @Inject(GLOBAL_CONFIGURATION_PLATFORM_CATALOG_PORT)
    private readonly catalog: GlobalConfigurationPlatformCatalogPort,
  ) {}

  execute: Promise<GlobalConfigurationPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const GLOBAL_CONFIGURATION_PLATFORM_HANDLERS = [GetGlobalConfigurationPlatformEngineHandler, ListGlobalConfigurationPlatformProductsHandler];

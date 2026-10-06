import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPlatformEngineeringAnalyticsEngineQuery, ListPlatformEngineeringAnalyticsProductsQuery } from './messages';
import {
  PLATFORM_ENGINEERING_ANALYTICS_CATALOG_PORT,
  PlatformEngineeringAnalyticsCatalogPort,
  PlatformEngineeringAnalyticsEngineBundle,
  PlatformEngineeringAnalyticsProductRow,
} from './ports';

@QueryHandler(GetPlatformEngineeringAnalyticsEngineQuery)
export class GetPlatformEngineeringAnalyticsEngineHandler
  implements IQueryHandler<GetPlatformEngineeringAnalyticsEngineQuery>
{
  constructor(
    @Inject(PLATFORM_ENGINEERING_ANALYTICS_CATALOG_PORT)
    private readonly catalog: PlatformEngineeringAnalyticsCatalogPort,
  ) {}

  execute: Promise<PlatformEngineeringAnalyticsEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListPlatformEngineeringAnalyticsProductsQuery)
export class ListPlatformEngineeringAnalyticsProductsHandler
  implements IQueryHandler<ListPlatformEngineeringAnalyticsProductsQuery>
{
  constructor(
    @Inject(PLATFORM_ENGINEERING_ANALYTICS_CATALOG_PORT)
    private readonly catalog: PlatformEngineeringAnalyticsCatalogPort,
  ) {}

  execute: Promise<PlatformEngineeringAnalyticsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const PLATFORM_ENGINEERING_ANALYTICS_HANDLERS = [GetPlatformEngineeringAnalyticsEngineHandler, ListPlatformEngineeringAnalyticsProductsHandler];

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTrustAnalyticsEngineQuery, ListTrustAnalyticsProductsQuery } from './messages';
import {
  TRUST_ANALYTICS_CATALOG_PORT,
  TrustAnalyticsCatalogPort,
  TrustAnalyticsEngineBundle,
  TrustAnalyticsProductRow,
} from './ports';

@QueryHandler(GetTrustAnalyticsEngineQuery)
export class GetTrustAnalyticsEngineHandler
  implements IQueryHandler<GetTrustAnalyticsEngineQuery>
{
  constructor(
    @Inject(TRUST_ANALYTICS_CATALOG_PORT)
    private readonly catalog: TrustAnalyticsCatalogPort,
  ) {}

  execute: Promise<TrustAnalyticsEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListTrustAnalyticsProductsQuery)
export class ListTrustAnalyticsProductsHandler
  implements IQueryHandler<ListTrustAnalyticsProductsQuery>
{
  constructor(
    @Inject(TRUST_ANALYTICS_CATALOG_PORT)
    private readonly catalog: TrustAnalyticsCatalogPort,
  ) {}

  execute: Promise<TrustAnalyticsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const TRUST_ANALYTICS_HANDLERS = [GetTrustAnalyticsEngineHandler, ListTrustAnalyticsProductsHandler];

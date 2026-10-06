import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetControlPlaneAnalyticsEngineQuery, ListControlPlaneAnalyticsProductsQuery } from './messages';
import {
  CONTROL_PLANE_ANALYTICS_CATALOG_PORT,
  ControlPlaneAnalyticsCatalogPort,
  ControlPlaneAnalyticsEngineBundle,
  ControlPlaneAnalyticsProductRow,
} from './ports';

@QueryHandler(GetControlPlaneAnalyticsEngineQuery)
export class GetControlPlaneAnalyticsEngineHandler
  implements IQueryHandler<GetControlPlaneAnalyticsEngineQuery>
{
  constructor(
    @Inject(CONTROL_PLANE_ANALYTICS_CATALOG_PORT)
    private readonly catalog: ControlPlaneAnalyticsCatalogPort,
  ) {}

  execute: Promise<ControlPlaneAnalyticsEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListControlPlaneAnalyticsProductsQuery)
export class ListControlPlaneAnalyticsProductsHandler
  implements IQueryHandler<ListControlPlaneAnalyticsProductsQuery>
{
  constructor(
    @Inject(CONTROL_PLANE_ANALYTICS_CATALOG_PORT)
    private readonly catalog: ControlPlaneAnalyticsCatalogPort,
  ) {}

  execute: Promise<ControlPlaneAnalyticsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const CONTROL_PLANE_ANALYTICS_HANDLERS = [GetControlPlaneAnalyticsEngineHandler, ListControlPlaneAnalyticsProductsHandler];

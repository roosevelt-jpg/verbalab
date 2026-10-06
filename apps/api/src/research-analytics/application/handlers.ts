import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetResearchAnalyticsEngineQuery, ListResearchAnalyticsProductsQuery } from './messages';
import {
  RESEARCH_ANALYTICS_CATALOG_PORT,
  ResearchAnalyticsCatalogPort,
  ResearchAnalyticsEngineBundle,
  ResearchAnalyticsProductRow,
} from './ports';

@QueryHandler(GetResearchAnalyticsEngineQuery)
export class GetResearchAnalyticsEngineHandler
  implements IQueryHandler<GetResearchAnalyticsEngineQuery>
{
  constructor(
    @Inject(RESEARCH_ANALYTICS_CATALOG_PORT)
    private readonly catalog: ResearchAnalyticsCatalogPort,
  ) {}

  execute: Promise<ResearchAnalyticsEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListResearchAnalyticsProductsQuery)
export class ListResearchAnalyticsProductsHandler
  implements IQueryHandler<ListResearchAnalyticsProductsQuery>
{
  constructor(
    @Inject(RESEARCH_ANALYTICS_CATALOG_PORT)
    private readonly catalog: ResearchAnalyticsCatalogPort,
  ) {}

  execute: Promise<ResearchAnalyticsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const RESEARCH_ANALYTICS_HANDLERS = [GetResearchAnalyticsEngineHandler, ListResearchAnalyticsProductsHandler];

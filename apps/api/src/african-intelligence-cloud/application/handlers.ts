import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAfricanIntelligenceCloudEngineQuery, ListAfricanIntelligenceCloudProductsQuery } from './messages';
import {
  AFRICAN_INTELLIGENCE_CLOUD_CATALOG_PORT,
  AfricanIntelligenceCloudCatalogPort,
  AfricanIntelligenceCloudEngineBundle,
  AfricanIntelligenceCloudProductRow,
} from './ports';

@QueryHandler(GetAfricanIntelligenceCloudEngineQuery)
export class GetAfricanIntelligenceCloudEngineHandler
  implements IQueryHandler<GetAfricanIntelligenceCloudEngineQuery>
{
  constructor(
    @Inject(AFRICAN_INTELLIGENCE_CLOUD_CATALOG_PORT)
    private readonly catalog: AfricanIntelligenceCloudCatalogPort,
  ) {}

  execute: Promise<AfricanIntelligenceCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAfricanIntelligenceCloudProductsQuery)
export class ListAfricanIntelligenceCloudProductsHandler
  implements IQueryHandler<ListAfricanIntelligenceCloudProductsQuery>
{
  constructor(
    @Inject(AFRICAN_INTELLIGENCE_CLOUD_CATALOG_PORT)
    private readonly catalog: AfricanIntelligenceCloudCatalogPort,
  ) {}

  execute: Promise<AfricanIntelligenceCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AFRICAN_INTELLIGENCE_CLOUD_HANDLERS = [GetAfricanIntelligenceCloudEngineHandler, ListAfricanIntelligenceCloudProductsHandler];

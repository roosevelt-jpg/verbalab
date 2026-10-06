import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetResearchCloudEngineQuery, ListResearchCloudProductsQuery } from './messages';
import {
  RESEARCH_CLOUD_CATALOG_PORT,
  ResearchCloudCatalogPort,
  ResearchCloudEngineBundle,
  ResearchCloudProductRow,
} from './ports';

@QueryHandler(GetResearchCloudEngineQuery)
export class GetResearchCloudEngineHandler
  implements IQueryHandler<GetResearchCloudEngineQuery>
{
  constructor(
    @Inject(RESEARCH_CLOUD_CATALOG_PORT)
    private readonly catalog: ResearchCloudCatalogPort,
  ) {}

  execute: Promise<ResearchCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListResearchCloudProductsQuery)
export class ListResearchCloudProductsHandler
  implements IQueryHandler<ListResearchCloudProductsQuery>
{
  constructor(
    @Inject(RESEARCH_CLOUD_CATALOG_PORT)
    private readonly catalog: ResearchCloudCatalogPort,
  ) {}

  execute: Promise<ResearchCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const RESEARCH_CLOUD_HANDLERS = [GetResearchCloudEngineHandler, ListResearchCloudProductsHandler];

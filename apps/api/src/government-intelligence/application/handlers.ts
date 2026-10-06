import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGovernmentIntelligenceEngineQuery, ListGovernmentIntelligenceProductsQuery } from './messages';
import {
  GOVERNMENT_INTELLIGENCE_CATALOG_PORT,
  GovernmentIntelligenceCatalogPort,
  GovernmentIntelligenceEngineBundle,
  GovernmentIntelligenceProductRow,
} from './ports';

@QueryHandler(GetGovernmentIntelligenceEngineQuery)
export class GetGovernmentIntelligenceEngineHandler
  implements IQueryHandler<GetGovernmentIntelligenceEngineQuery>
{
  constructor(
    @Inject(GOVERNMENT_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: GovernmentIntelligenceCatalogPort,
  ) {}

  execute: Promise<GovernmentIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListGovernmentIntelligenceProductsQuery)
export class ListGovernmentIntelligenceProductsHandler
  implements IQueryHandler<ListGovernmentIntelligenceProductsQuery>
{
  constructor(
    @Inject(GOVERNMENT_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: GovernmentIntelligenceCatalogPort,
  ) {}

  execute: Promise<GovernmentIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const GOVERNMENT_INTELLIGENCE_HANDLERS = [GetGovernmentIntelligenceEngineHandler, ListGovernmentIntelligenceProductsHandler];
